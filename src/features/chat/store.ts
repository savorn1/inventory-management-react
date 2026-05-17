import { create } from 'zustand'
import { conversationsApi, messagesApi } from '@/api/chat.api'
import { usersApi } from '@/api/users.api'
import type { ConversationDTO, MessageDTO, CreateConversationDTO } from '@/api/chat.api'

const MUTED_KEY = 'chat_muted_ids'
const REMINDERS_KEY = 'chat_reminders'

function loadMuted(): number[] {
  try { return JSON.parse(localStorage.getItem(MUTED_KEY) ?? '[]') } catch { return [] }
}

function saveMuted(ids: number[]) {
  localStorage.setItem(MUTED_KEY, JSON.stringify(ids))
}

export interface Reminder {
  id: string
  messageId: number
  conversationId: number
  preview: string
  remindAt: number  // Unix ms
}

function loadReminders(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) ?? '[]') } catch { return [] }
}

function saveReminders(list: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(list))
}

interface ChatState {
  conversations: ConversationDTO[]
  loadingConv: boolean
  activeId: number | null
  messages: MessageDTO[]
  loadingMsgs: boolean
  hasMore: boolean
  msgPage: number
  /** userId → display name */
  userMap: Record<number, string>
  /** conversationId → list of member userIds */
  convMembers: Record<number, number[]>
  /** conversationId → unread message count */
  unreadCounts: Record<number, number>
  /** set of muted conversation IDs */
  mutedIds: number[]
  /** pending reminders */
  reminders: Reminder[]
}

interface ChatActions {
  fetchConversations: () => Promise<void>
  fetchUsers: (ids: number[]) => Promise<void>
  selectConversation: (id: number) => Promise<void>
  fetchMessages: (page?: number) => Promise<void>
  sendMessage: (content: string, replyTo?: number) => Promise<void>
  editMessage: (id: number, content: string) => Promise<void>
  deleteMessage: (id: number) => Promise<void>
  addRealtimeMessage: (msg: MessageDTO) => void
  createConversation: (dto: CreateConversationDTO) => Promise<ConversationDTO>
  updateConversationLastMessage: (msg: MessageDTO) => void
  toggleMute: (id: number) => void
  addReminder: (reminder: Omit<Reminder, 'id'>) => void
  dismissReminder: (id: string) => void
}

type ChatStore = ChatState & ChatActions

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  loadingConv: false,
  activeId: null,
  messages: [],
  loadingMsgs: false,
  hasMore: false,
  msgPage: 1,
  userMap: {},
  convMembers: {},
  unreadCounts: {},
  mutedIds: loadMuted(),
  reminders: loadReminders(),

  async fetchUsers(ids: number[]) {
    if (ids.length === 0) return
    const known = get().userMap
    const missing = ids.filter(id => !known[id])
    if (missing.length === 0) return
    const res = await usersApi.getByIds(missing)
    const patch: Record<number, string> = {}
    for (const u of res.data) patch[u.id] = u.name
    set(state => ({ userMap: { ...state.userMap, ...patch } }))
  },

  async fetchConversations() {
    set({ loadingConv: true })
    try {
      const res = await conversationsApi.getAll(1, 50)
      set({ conversations: res.data })

      // Collect user IDs already visible in conversation metadata
      const ids = new Set<number>()
      for (const c of res.data) {
        if (c.createdBy) ids.add(c.createdBy)
        if (c.lastMessage?.senderId) ids.add(c.lastMessage.senderId)
      }
      get().fetchUsers([...ids]).catch(() => {})

      // Eagerly fetch members for nameless PRIVATE conversations so the
      // conversation list shows real names on first render, not "Conversation #id"
      const privateMissing = res.data.filter(c => c.type === 'PRIVATE' && !c.name && !get().convMembers[c.id])
      privateMissing.forEach(c => {
        conversationsApi.getMembers(c.id).then(memberRes => {
          const memberIds = memberRes.data.map(m => m.userId)
          set(state => ({ convMembers: { ...state.convMembers, [c.id]: memberIds } }))
          get().fetchUsers(memberIds).catch(() => {})
        }).catch(() => {})
      })
    } finally {
      set({ loadingConv: false })
    }
  },

  async selectConversation(id) {
    set(state => ({
      activeId: id,
      messages: [],
      msgPage: 1,
      hasMore: false,
      unreadCounts: { ...state.unreadCounts, [id]: 0 },
    }))
    await get().fetchMessages(1)
    // Fetch members if not already cached, then resolve any unknown names
    if (!get().convMembers[id]) {
      conversationsApi.getMembers(id).then(res => {
        const memberIds = res.data.map(m => m.userId)
        set(state => ({
          convMembers: { ...state.convMembers, [id]: memberIds },
        }))
        get().fetchUsers(memberIds).catch(() => {})
      }).catch(() => {})
    }
  },

  async fetchMessages(page = get().msgPage) {
    const { activeId } = get()
    if (!activeId) return
    set({ loadingMsgs: true })
    try {
      const res = await messagesApi.getAll(activeId, page, 50)
      // API returns DESC; reverse for chronological display
      const incoming = [...res.data].reverse()
      const messages = page === 1 ? incoming : [...incoming, ...get().messages]
      set({
        messages,
        msgPage: page,
        hasMore: res.metadata.hasNext,
      })
      if (incoming.length > 0) {
        const lastId = incoming[incoming.length - 1].id
        conversationsApi.markAsRead(activeId, lastId).catch(() => {})
      }
    } finally {
      set({ loadingMsgs: false })
    }
  },

  async sendMessage(content, replyTo) {
    const { activeId } = get()
    if (!activeId || !content.trim()) return
    const res = await messagesApi.send({
      conversationId: activeId,
      content: content.trim(),
      replyTo: replyTo ?? null,
    })
    get().addRealtimeMessage(res.data)
  },

  async editMessage(id, content) {
    const res = await messagesApi.edit(id, content)
    set(state => ({
      messages: state.messages.map(m => m.id === id ? res.data : m),
    }))
  },

  async deleteMessage(id) {
    await messagesApi.delete(id)
    set(state => ({
      messages: state.messages.map(m =>
        m.id === id ? { ...m, deleted: true, content: null } : m,
      ),
    }))
  },

  addRealtimeMessage(msg) {
    const { activeId, messages, mutedIds } = get()
    if (msg.conversationId !== activeId) {
      if (!mutedIds.includes(msg.conversationId)) {
        set(state => ({
          unreadCounts: {
            ...state.unreadCounts,
            [msg.conversationId]: (state.unreadCounts[msg.conversationId] ?? 0) + 1,
          },
        }))
      }
      get().updateConversationLastMessage(msg)
      return
    }
    const existingIdx = messages.findIndex(m => m.id === msg.id)
    if (existingIdx !== -1) {
      const updated = [...messages]
      updated[existingIdx] = msg
      set({ messages: updated })
      get().updateConversationLastMessage(msg)
      return
    }
    set({ messages: [...messages, msg] })
    get().updateConversationLastMessage(msg)
    conversationsApi.markAsRead(activeId, msg.id).catch(() => {})
  },

  updateConversationLastMessage(msg) {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: {
                messageId: msg.id,
                senderId: msg.senderId,
                content: msg.content ?? '',
                createdAt: msg.createdAt,
              },
              updatedAt: msg.createdAt,
            }
          : c,
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    }))
  },

  async createConversation(dto) {
    const res = await conversationsApi.create(dto)
    set(state => ({ conversations: [res.data, ...state.conversations] }))
    return res.data
  },

  toggleMute(id) {
    const { mutedIds } = get()
    const next = mutedIds.includes(id) ? mutedIds.filter(x => x !== id) : [...mutedIds, id]
    saveMuted(next)
    set({ mutedIds: next })
  },

  addReminder(reminder) {
    const next = [...get().reminders, { ...reminder, id: `${Date.now()}-${reminder.messageId}` }]
    saveReminders(next)
    set({ reminders: next })
  },

  dismissReminder(id) {
    const next = get().reminders.filter(r => r.id !== id)
    saveReminders(next)
    set({ reminders: next })
  },
}))
