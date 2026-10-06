import axios from 'axios'

// 统一 axios 实例：baseURL 走 vite 代理，避免跨域
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动带上 token（后面做登录态时用到）
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理错误
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    // 401 = 未登录 / token 过期：静默清理登录态并回登录页，不弹窗打扰
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    const msg = error.response?.data?.message || '网络错误'
    alert(msg)
    return Promise.reject(error)
  }
)

export default request
