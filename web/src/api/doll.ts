import request from './request'

export interface Doll {
  id: number
  userId?: number
  cabinetId?: number
  name: string
  type?: string
  imageUrl?: string
  buyChannel?: string
  description?: string
  price?: number
  visible?: number   // 0公开 1仅自己可见
  createdAt?: string
}

// 查看某用户展示柜
export function getDollsByUser(userId: number) {
  return request.get('/doll/list', { params: { userId } })
}

// 查看自己展示柜
export function getMyDolls() {
  return request.get('/doll/mine')
}

// 添加娃娃
export function addDoll(data: Partial<Doll>) {
  return request.post('/doll', data)
}

// 编辑娃娃
export function updateDoll(id: number, data: Partial<Doll>) {
  return request.put(`/doll/${id}`, data)
}

// 删除娃娃
export function deleteDoll(id: number) {
  return request.delete(`/doll/${id}`)
}

// 娃娃详情（娃娃 + 主人 + 柜子）
export function getDollDetail(id: number) {
  return request.get(`/doll/${id}`)
}
