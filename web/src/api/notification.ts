import request from './request'

export interface NotificationItem {
  id: number
  type: string   // follow/like/comment
  actorId: number
  actorNickname?: string
  actorAvatar?: string
  dynamicId?: number
  isRead: number
  createdAt: string
}

// 我的通知列表
export function getNotifications() {
  return request.get('/notification/mine')
}

// 未读通知数
export function getUnreadCount() {
  return request.get('/notification/unreadCount')
}

// 全部标记已读
export function readAllNotifications() {
  return request.post('/notification/readAll')
}
