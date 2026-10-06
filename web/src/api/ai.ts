import request from './request'

// AI 助手：问平台数据（自己的娃娃柜 + 公开娃娃）
export function askAi(question: string) {
  return request.post('/ai/ask', { question })
}

// AI 助手：最近聊天记录（最新在前）
export function aiHistory() {
  return request.get('/ai/history')
}
