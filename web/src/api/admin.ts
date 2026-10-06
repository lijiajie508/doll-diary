import request from './request'

// 数据看板统计
export function getStats() {
  return request.get('/admin/stats')
}

// 用户列表（分页 + 搜索）
export function getUsers(params: { page: number; size: number; keyword?: string }) {
  return request.get('/admin/users', { params })
}

// 动态列表（分页 + 搜索）
export function getAdminDynamics(params: { page: number; size: number; keyword?: string }) {
  return request.get('/admin/dynamics', { params })
}

// 评论列表（分页 + 搜索）
export function getAdminComments(params: { page: number; size: number; keyword?: string }) {
  return request.get('/admin/comments', { params })
}

// 娃娃列表（分页 + 搜索）
export function getAdminDolls(params: { page: number; size: number; keyword?: string }) {
  return request.get('/admin/dolls', { params })
}

// 封禁 / 解封用户
export function updateUserStatus(id: number, status: number) {
  return request.put(`/admin/user/${id}/status`, null, { params: { status } })
}

// 举报列表（分页 + 状态筛选：0待处理 1已处理 2已忽略）
export function getReports(params: { page: number; size: number; status?: number }) {
  return request.get('/admin/reports', { params })
}

// 处理举报：ignore 忽略 / delete 删除内容 / ban 封禁用户并删除内容
export function handleReport(id: number, action: 'ignore' | 'delete' | 'ban') {
  return request.post(`/admin/reports/${id}/handle`, null, { params: { action } })
}

// 管理员操作日志列表
export function getOpLogs(params: { page: number; size: number }) {
  return request.get('/admin/opLogs', { params })
}
