import request from './request'

// 登录
export function login(data: { username: string; password: string }) {
  return request.post('/user/login', data)
}

// 注册（支持默认 emoji 头像或上传图片）
export function register(data: {
  username: string
  password: string
  nickname?: string
  defaultAvatar?: string
  avatarFile?: File | null
}) {
  const fd = new FormData()
  fd.append('username', data.username)
  fd.append('password', data.password)
  if (data.nickname) fd.append('nickname', data.nickname)
  if (data.defaultAvatar) fd.append('defaultAvatar', data.defaultAvatar)
  if (data.avatarFile) fd.append('avatarFile', data.avatarFile)
  return request.post('/user/register', fd)
}

// 获取当前登录用户信息
export function getMe() {
  return request.get('/user/me')
}

// 用户公开资料（他人主页用）
export function getUserProfile(id: number) {
  return request.get(`/user/${id}`)
}

// 更新头像（默认 emoji 或上传图片），返回新头像值
export function updateAvatar(data: { avatar?: string; avatarFile?: File | null }) {
  const fd = new FormData()
  if (data.avatar) fd.append('avatar', data.avatar)
  if (data.avatarFile) fd.append('avatarFile', data.avatarFile)
  return request.put('/user/avatar', fd)
}

// 更新个人资料（昵称/简介/背景图）
export function updateProfile(data: { nickname?: string; intro?: string; bgImage?: string; bgFile?: File | null }) {
  const fd = new FormData()
  if (data.nickname) fd.append('nickname', data.nickname)
  if (data.intro) fd.append('intro', data.intro)
  if (data.bgImage) fd.append('bgImage', data.bgImage)
  if (data.bgFile) fd.append('bgFile', data.bgFile)
  return request.put('/user/profile', fd)
}

// 个人年度统计
export function getMyStats() {
  return request.get('/user/stats')
}
