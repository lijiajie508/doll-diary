import request from './request'

export interface CabinetInfo {
  id: number
  name: string
  visible?: number   // 0公开 1仅自己可见
  count: number
  totalPrice: number
}

// 我的娃柜列表（含数量/总金额）
export function getMyCabinets() {
  return request.get('/cabinet/mine')
}

// 新建柜子（visible:0公开,1仅自己可见）
export function createCabinet(name: string, visible = 0) {
  return request.post('/cabinet', null, { params: { name, visible } })
}

// 编辑柜子：改名 / 切换可见性（只传需要修改的字段）
export function updateCabinet(id: number, name?: string, visible?: number) {
  return request.put(`/cabinet/${id}`, null, { params: { name, visible } })
}

// 删除柜子（柜内娃娃自动移到其他柜）
export function deleteCabinet(id: number) {
  return request.delete(`/cabinet/${id}`)
}
