import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface LastMessageInfo {
  messageId: number
  senderId: number
  content: string
  createdAt: string
}

export interface ConversationDTO {
  id: number
  type: 'DIRECT' | 'GROUP' | 'CHANNEL' | 'PRIVATE'
  name: string | null
  avatar: string | null
  createdBy: number
  lastMessage: LastMessageInfo | null
  inviteToken: string | null
  createdAt: string
  updatedAt: string
}

export interface MessageDTO {
  id: number
  conversationId: number
  senderId: number
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'SYSTEM'
  content: string | null
  replyTo: number | null
  deleted: boolean
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationMemberDTO {
  id: number
  conversationId: number
  userId: number
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
}

export interface CreateConversationDTO {
  type: 'DIRECT' | 'GROUP'
  name?: string
  memberIds: number[]
}

export interface SendMessageDTO {
  conversationId: number
  type?: string
  content: string
  replyTo?: number | null
}

export const conversationsApi = {
  getAll: (page = 1, size = 20) =>
    http.get<PageResponse<ConversationDTO>>(`api/chat/conversations?page=${page}&size=${size}`),

  getById: (id: number) =>
    http.get<ApiResponse<ConversationDTO>>(`api/chat/conversations/${id}`),

  create: (dto: CreateConversationDTO) =>
    http.post<ApiResponse<ConversationDTO>>('api/chat/conversations', dto),

  getMembers: (id: number) =>
    http.get<ApiResponse<ConversationMemberDTO[]>>(`api/chat/conversations/${id}/members`),

  markAsRead: (id: number, messageId: number) =>
    http.patch<ApiResponse<unknown>>(`api/chat/conversations/${id}/read?messageId=${messageId}`, {}),
}

export const messagesApi = {
  getAll: (conversationId: number, page = 1, size = 50) => {
    const params = new URLSearchParams({
      conversationId: String(conversationId),
      page: String(page),
      size: String(size),
    })
    return http.get<PageResponse<MessageDTO>>(`api/chat/messages?${params}`)
  },

  send: (dto: SendMessageDTO) =>
    http.post<ApiResponse<MessageDTO>>('api/chat/messages', dto),

  edit: (id: number, content: string) =>
    http.put<ApiResponse<MessageDTO>>(`api/chat/messages/${id}`, { content }),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/chat/messages/${id}`),
}
