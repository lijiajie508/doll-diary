import request from './request'

// 某条动态的评论列表
export function getComments(dynamicId: number) {
  return request.get('/comment/list', { params: { dynamicId } })
}

// 我的评论列表
export function getMyComments() {
  return request.get('/comment/mine')
}

// 发表评论
export function addComment(data: { dynamicId: number; content: string }) {
  return request.post('/comment', data)
}

// 删除评论
export function deleteComment(id: number) {
  return request.delete(`/comment/${id}`)
}
