import request from './request'

// 统一搜索：用户/娃娃/动态
export function searchAll(keyword: string) {
  return request.get('/search', { params: { keyword } })
}

export interface SearchUser {
  id: number
  username: string
  nickname: string
  avatar?: string
}

export interface SearchDoll {
  id: number
  userId: number
  name: string
  type?: string
  imageUrl?: string
  price?: number
  createdAt?: string
  nickname: string
  avatar?: string
}
