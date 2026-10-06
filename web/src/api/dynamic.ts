import request from './request'

// 信息流列表（分页）
export function getFeed(page = 1, size = 10) {
  return request.get('/dynamic/feed', { params: { page, size } })
}

// 某用户发布的动态（他人主页）
export function getDynamicsByUser(userId: number) {
  return request.get('/dynamic/byUser', { params: { userId } })
}

// 发布动态
export function publishDynamic(data: { content: string; images?: string; dollId?: number }) {
  return request.post('/dynamic', data)
}

// 删除动态
export function deleteDynamic(id: number) {
  return request.delete(`/dynamic/${id}`)
}
