import request from './request'

export interface Conversation {
  otherId: number
  nickname: string
  avatar?: string
  lastMessage: string
  lastTime: string
  unread: number
}

export interface ChatMessage {
  id: number
  senderId: number
  receiverId: number
  content: string
  createdAt: string
}

// 会话列表
export function getConversations() {
  return request.get('/message/conversations')
}

// 与某人的聊天记录
export function getThread(otherId: number) {
  return request.get('/message/thread', { params: { otherId } })
}

// 发送私信
export function sendMessage(receiverId: number, content: string) {
  return request.post('/message/send', { receiverId, content })
}

// 标记已读
export function markMessageRead(otherId: number) {
  return request.post('/message/read', null, { params: { otherId } })
}

// 未读私信总数
export function getMessageUnread() {
  return request.get('/message/unreadTotal')
}
