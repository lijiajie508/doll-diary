import request from './request'

// 用户端：举报动态 / 评论 / 用户
export function submitReport(data: { type: 'dynamic' | 'comment' | 'user'; targetId: number; reason?: string }) {
  return request.post('/report', data)
}
