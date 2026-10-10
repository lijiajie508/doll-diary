import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/user'
import { compressImage } from '../utils/compress'
import './Login.css'

/* ============================================================
   登录/注册页
   背景 = 水彩插画（左：小熊帽女孩；右留白放登录卡片）
   ============================================================ */
function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)

  const defaultAvatars = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼']
  const [avatarEmoji, setAvatarEmoji] = useState('🐻')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 体验账号（密码都是 123456）——点击直接登录
  const quickAccounts = [
    { u: 'admin',    name: '管理员',   emoji: '👑' },
    { u: 'dollfan',  name: '娃娃控',   emoji: '🐰' },
    { u: 'catboy',   name: '棉花娃控', emoji: '🙋' },
    { u: 'kittyfan', name: '凯蒂控',   emoji: '🎀' },
    { u: 'stella',   name: '露露控',   emoji: '💜' },
  ]

  const doLogin = async (username: string, password: string) => {
    setLoading(true)
    setNote(null)
    try {
      const res: any = await login({ username, password })
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('nickname', res.data.nickname)
        localStorage.setItem('avatar', res.data.avatar || '')
        localStorage.setItem('userId', String(res.data.id))
        localStorage.setItem('role', String(res.data.role))
        navigate(res.data.role === 2 ? '/admin' : '/')
      } else {
        setNote({ text: res.message || '登录失败', ok: false })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    if (!username || !password) {
      setNote({ text: '请输入用户名和密码', ok: false })
      return
    }
    doLogin(username, password)
  }

  const handleRegister = async () => {
    if (!username || !password) {
      setNote({ text: '请输入用户名和密码', ok: false })
      return
    }
    setLoading(true)
    setNote(null)
    try {
      const res: any = await register({
        username,
        password,
        nickname,
        defaultAvatar: avatarFile ? undefined : avatarEmoji,
        avatarFile,
      })
      if (res.code === 200) {
        setNote({ text: '注册成功，请登录', ok: true })
        setIsRegister(false)
      } else {
        setNote({ text: res.message || '注册失败', ok: false })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 400, 0.85)
    setAvatarFile(compressed)
  }

  const switchMode = (to: boolean) => {
    setIsRegister(to)
    setNote(null)
  }

  return (
    <div className="lg-page">
      {/* ===== 两扇柜门：加载时打开 ===== */}
      <div className="lg-door lg-door-left" aria-hidden="true" />
      <div className="lg-door lg-door-right" aria-hidden="true" />

      {/* ===== 登录卡片（靠右） ===== */}
      <form
        className="lg-card"
        onSubmit={(e) => {
          e.preventDefault()
          isRegister ? handleRegister() : handleLogin()
        }}
      >
        <div className="lg-brand">
          <span className="lg-brand-emoji">🧸</span>
          <span className="lg-brand-name">娃柜日记</span>
        </div>
        <h1 className="lg-title">{isRegister ? '注册新账号' : '欢迎回来'}</h1>
        <p className="lg-sub">
          {isRegister ? '创建账号，开始记录你的娃娃' : '登录后继续打理你的娃娃柜'}
        </p>

        <div className="lg-field">
          <label className="lg-label" htmlFor="lg-user">用户名</label>
          <input
            id="lg-user"
            className="lg-input"
            placeholder="输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="lg-field">
          <label className="lg-label" htmlFor="lg-pass">密码</label>
          <input
            id="lg-pass"
            className="lg-input"
            type="password"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isRegister && (
          <>
            <div className="lg-field">
              <label className="lg-label" htmlFor="lg-nick">昵称（可不填）</label>
              <input
                id="lg-nick"
                className="lg-input"
                placeholder="给自己起个名字"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="lg-field">
              <span className="lg-label">头像</span>
              <div className="lg-avatars">
                {defaultAvatars.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="lg-avatar"
                    aria-pressed={avatarFile === null && avatarEmoji === e}
                    onClick={() => {
                      setAvatarEmoji(e)
                      setAvatarFile(null)
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="lg-upload-row">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button type="button" className="lg-upload" onClick={() => fileRef.current?.click()}>
                  📷 上传照片
                </button>
                <span className="lg-file">{avatarFile ? `已选：${avatarFile.name}` : ''}</span>
              </div>
            </div>
          </>
        )}

        {note && (
          <div className={`lg-note ${note.ok ? 'is-ok' : 'is-error'}`}>{note.text}</div>
        )}

        <button type="submit" className="lg-submit" disabled={loading}>
          {loading ? '处理中...' : isRegister ? '注册' : '登录'}
        </button>

        <div className="lg-switch">
          {isRegister ? '已有账号？' : '还没有账号？'}
          <button type="button" onClick={() => switchMode(!isRegister)}>
            {isRegister ? '去登录' : '去注册'}
          </button>
        </div>
      </form>

      {/* ===== 体验账号：右下角小角落 ===== */}
      <div className="lg-quick" data-open={quickOpen}>
        <button
          type="button"
          className="lg-quick-toggle"
          onClick={() => setQuickOpen((v) => !v)}
          aria-expanded={quickOpen}
        >
          ✨ 体验账号
          <span className="lg-caret">▾</span>
        </button>
        <div className="lg-quick-list" role="menu">
          <p className="lg-quick-hint">点一下直接登录</p>
          {quickAccounts.map((a) => (
            <button
              key={a.u}
              type="button"
              className="lg-quick-item"
              role="menuitem"
              onClick={() => {
                setQuickOpen(false)
                doLogin(a.u, '123456')
              }}
            >
              <span>{a.emoji} {a.name}</span>
              <i>{a.u}</i>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login
