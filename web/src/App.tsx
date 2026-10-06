import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Cabinet from './pages/Cabinet'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Search from './pages/Search'
import AiChat from './pages/AiChat'
import Messages from './pages/Messages'
import Admin from './pages/Admin'

/**
 * 路由守卫：角色与页面硬隔离
 * - 未登录 → 登录页
 * - 管理员访问用户页面（展示柜/个人主页）→ 重定向管理后台
 * - 普通用户访问管理后台 → 重定向首页
 */
function RequireRole({ roles, children }: { roles: number[]; children: ReactNode }) {
  const token = localStorage.getItem('token')
  const role = Number(localStorage.getItem('role') || 0)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(role)) {
    return <Navigate to={role === 2 ? '/admin' : '/'} replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<Login />} />
        {/* 首页信息流：仅普通用户（管理员访问自动落到 /admin） */}
        <Route path="/" element={<RequireRole roles={[1]}><Home /></RequireRole>} />
        {/* 展示柜：仅普通用户 */}
        <Route path="/cabinet" element={<RequireRole roles={[1]}><Cabinet /></RequireRole>} />
        {/* 个人主页：仅普通用户 */}
        <Route path="/profile" element={<RequireRole roles={[1]}><Profile /></RequireRole>} />
        {/* 他人主页：仅普通用户 */}
        <Route path="/user/:id" element={<RequireRole roles={[1]}><UserProfile /></RequireRole>} />
        {/* 搜索：仅普通用户 */}
        <Route path="/search" element={<RequireRole roles={[1]}><Search /></RequireRole>} />
        {/* AI 助手：仅普通用户 */}
        <Route path="/ai" element={<RequireRole roles={[1]}><AiChat /></RequireRole>} />
        {/* 私信：仅普通用户 */}
        <Route path="/messages" element={<RequireRole roles={[1]}><Messages /></RequireRole>} />
        {/* 管理后台：仅管理员 */}
        <Route path="/admin" element={<RequireRole roles={[2]}><Admin /></RequireRole>} />
        {/* 未知地址回首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
