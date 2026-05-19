import type { ConversationDTO } from '@/api/chat.api'

export function timeLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-CA')
}

export function resolveConvName(
  c: ConversationDTO,
  convMembers: Record<number, number[]>,
  userMap: Record<number, string>,
  currentUserId: number | undefined,
): string {
  if (c.name) return c.name
  if (c.type === 'PRIVATE') {
    const otherId = convMembers[c.id]?.find(id => id !== currentUserId)
    if (otherId) return userMap[otherId] ?? `Conversation #${c.id}`
  }
  return `Conversation #${c.id}`
}
