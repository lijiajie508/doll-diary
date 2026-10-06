import request from './request'

// 关注/取消关注
export function toggleFollow(followedId: number) {
  return request.post('/follow/toggle', null, { params: { followedId } })
}

// 我是否已关注某用户
export function getFollowStatus(followedId: number) {
  return request.get('/follow/status', { params: { followedId } })
}

// 我的关注数 / 粉丝数
export function getFollowCounts() {
  return request.get('/follow/counts')
}

// 我关注的人列表
export function getFollowing() {
  return request.get('/follow/following')
}

// 我的粉丝列表
export function getFans() {
  return request.get('/follow/fans')
}

export interface FollowUser {
  id: number
  username: string
  nickname: string
  avatar?: string
  following: boolean
}
