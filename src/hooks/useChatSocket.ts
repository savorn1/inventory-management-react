import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { MessageDTO } from '@/api/chat.api'

export interface TypingEvent {
  conversationId: number
  userId: number
  typing: boolean
}

type MessageHandler = (msg: MessageDTO) => void
type TypingHandler = (event: TypingEvent) => void

export function useChatSocket(
  conversationId: number | null,
  allConversationIds: number[],
  onMessage: MessageHandler,
  onTyping?: TypingHandler,
) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const onMessageRef = useRef(onMessage)
  const onTypingRef = useRef(onTyping)
  const convIdRef = useRef(conversationId)
  const allConvIdsRef = useRef(allConversationIds)
  // id → unsubscribe fn for per-conversation message topics
  const msgSubsRef = useRef<Map<number, () => void>>(new Map())
  // unsubscribe fn for the active conversation's typing topic
  const typingUnsubRef = useRef<(() => void) | null>(null)
  // serialised key to skip subscription sync when IDs haven't changed
  const allConvIdsKeyRef = useRef('')

  useEffect(() => { onMessageRef.current = onMessage })
  useEffect(() => { onTypingRef.current = onTyping })
  useEffect(() => { convIdRef.current = conversationId }, [conversationId])

  // Create STOMP client once
  useEffect(() => {
    function subMsg(client: Client, id: number) {
      if (msgSubsRef.current.has(id)) return
      const s = client.subscribe(`/topic/conversations/${id}`, frame => {
        try { onMessageRef.current(JSON.parse(frame.body)) } catch { /* ignore malformed */ }
      })
      msgSubsRef.current.set(id, () => s.unsubscribe())
    }

    function subTyping(client: Client, id: number) {
      typingUnsubRef.current?.()
      const s = client.subscribe(`/topic/conversations/${id}/typing`, frame => {
        try { onTypingRef.current?.(JSON.parse(frame.body)) } catch { /* ignore */ }
      })
      typingUnsubRef.current = () => s.unsubscribe()
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        msgSubsRef.current.clear()
        for (const id of allConvIdsRef.current) subMsg(client, id)
        if (convIdRef.current) subTyping(client, convIdRef.current)
      },
      onDisconnect: () => {
        setConnected(false)
        msgSubsRef.current.clear()
        typingUnsubRef.current = null
      },
      onStompError: () => setConnected(false),
    })

    clientRef.current = client
    client.activate()

    return () => {
      typingUnsubRef.current?.()
      msgSubsRef.current.forEach(unsub => unsub())
      msgSubsRef.current.clear()
      client.deactivate()
    }
  }, [])

  // Sync message subscriptions when the conversation list changes
  useEffect(() => {
    allConvIdsRef.current = allConversationIds

    const key = allConversationIds.join(',')
    if (key === allConvIdsKeyRef.current) return
    allConvIdsKeyRef.current = key

    const client = clientRef.current
    if (!client?.connected) return

    const idSet = new Set(allConversationIds)
    for (const [id, unsub] of msgSubsRef.current) {
      if (!idSet.has(id)) { unsub(); msgSubsRef.current.delete(id) }
    }
    for (const id of allConversationIds) {
      if (!msgSubsRef.current.has(id)) {
        const s = client.subscribe(`/topic/conversations/${id}`, frame => {
          try { onMessageRef.current(JSON.parse(frame.body)) } catch { /* ignore */ }
        })
        msgSubsRef.current.set(id, () => s.unsubscribe())
      }
    }
  }, [allConversationIds])

  // Update typing subscription when active conversation changes
  useEffect(() => {
    const client = clientRef.current
    typingUnsubRef.current?.()
    typingUnsubRef.current = null
    if (!client?.connected || !conversationId) return
    const s = client.subscribe(`/topic/conversations/${conversationId}/typing`, frame => {
      try { onTypingRef.current?.(JSON.parse(frame.body)) } catch { /* ignore */ }
    })
    typingUnsubRef.current = () => s.unsubscribe()
  }, [conversationId])

  function sendTyping(typing: boolean) {
    const client = clientRef.current
    if (!client?.connected || !conversationId) return
    client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, typing }),
    })
  }

  return { connected, sendTyping }
}
