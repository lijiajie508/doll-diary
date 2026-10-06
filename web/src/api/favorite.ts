import request from './request'

// 点赞/取消点赞
export function toggleLike(dynamicId: number) {
  return request.post('/favorite/toggle', null, { params: { dynamicId } })
}

// 我点赞过的动态
export function getMyLikedDynamics() {
  return request.get('/favorite/mine')
}
