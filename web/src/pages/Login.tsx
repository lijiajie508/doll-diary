import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/user'
import { compressImage } from '../utils/compress'

/**
 * 登录/注册页（V3 玫瑰粉）：左品牌区 + 右表单区，现代分栏布局
 */
function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  // 注册头像：默认 emoji 或上传图片
  const defaultAvatars = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼']
  const [avatarEmoji, setAvatarEmoji] = useState('🐻')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 快捷账号（密码都是 123456）——点击直接登录
  const quickAccounts = [
    { label: '👑 管理员 admin', u: 'admin' },
    { label: '🐰 娃娃控 dollfan', u: 'dollfan' },
    { label: '🙋 棉花娃控 catboy', u: 'catboy' },
    { label: '🎀 凯蒂控 kittyfan', u: 'kittyfan' },
    { label: '💜 露露控 stella', u: 'stella' }
  ]

  // 执行登录（成功后按角色跳转，不弹欢迎窗）
  const doLogin = async (username: string, password: string) => {
    setLoading(true)
    try {
      const res: any = await login({ username, password })
      if (res.code === 200) {
        // 存 token、昵称、头像、userId、角色，供后续请求和"管理后台"判断使用
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('nickname', res.data.nickname)
        localStorage.setItem('avatar', res.data.avatar || '')
        localStorage.setItem('userId', String(res.data.id))
        localStorage.setItem('role', String(res.data.role))
        // 管理员直接进管理后台，普通用户进首页（不弹欢迎窗）
        navigate(res.data.role === 2 ? '/admin' : '/')
      } else {
        alert(res.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // 表单登录
  const handleLogin = () => {
    if (!username || !password) {
      alert('请输入用户名和密码')
      return
    }
    doLogin(username, password)
  }

  // 注册
  const handleRegister = async () => {
    if (!username || !password) {
      alert('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      // 上传了图片则传文件，否则传默认 emoji 头像
      const res: any = await register({
        username,
        password,
        nickname,
        defaultAvatar: avatarFile ? undefined : avatarEmoji,
        avatarFile
      })
      if (res.code === 200) {
        alert('注册成功，请登录')
        setIsRegister(false)
      } else {
        alert(res.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // 选择上传的图片（注册头像，自动压缩到 400px）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 400, 0.85)
    setAvatarFile(compressed)
  }

  return (
    <div style={styles.wrap}>
      {/* ===== 左：品牌区（玫瑰粉渐变） ===== */}
      <div className="login-left" style={styles.left}>
        {/* 背景装饰 */}
        <div style={styles.leftDeco1} />
        <div style={styles.leftDeco2} />
        <div style={styles.leftDeco3} />
        <div style={styles.leftEmoji1}>🎀</div>
        <div style={styles.leftEmoji2}>🧸</div>
        <div style={styles.leftEmoji3}>✨</div>
        <div style={styles.leftEmoji4}>🐻</div>

        <div style={styles.leftInner}>
          <div style={styles.logoBox}>🐻</div>
          <h1 style={styles.brand}>娃柜日记</h1>
          <p style={styles.brandSlogan}>
            记录每一只心爱的娃娃
            <br />
            和同好分享你的快乐
          </p>
        </div>

        <p style={styles.leftFooter}>© 2026 娃柜日记 · 为爱娃的你而做</p>
      </div>

      {/* ===== 右：表单区 ===== */}
      <div style={styles.right}>
        <div style={styles.form}>
          <h2 style={styles.title}>{isRegister ? '加入娃柜日记' : '欢迎回来 👋'}</h2>
          <p style={styles.subtitle}>
            {isRegister ? '创建账号，开始记录你的娃娃' : '登录后继续管理你的娃娃柜'}
          </p>

          {/* 快捷账号 */}
          {!isRegister && (
            <div style={styles.quickBox}>
              <div style={styles.quickLabel}>快速体验 · 点一下直接登录</div>
              <div style={styles.quickGrid}>
                {quickAccounts.map((a, i) => (
                  <button
                    key={a.u}
                    className="login-quick-btn"
                    style={{ ...styles.quickBtn, ...(i === 0 ? { gridColumn: '1 / -1' } : {}) }}
                    onClick={() => doLogin(a.u, '123456')}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 表单 */}
          <input
            style={styles.input}
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isRegister && (
            <input
              style={styles.input}
              placeholder="昵称（可不填）"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          )}

          {/* 注册头像选择：默认头像 或 上传照片 */}
          {isRegister && (
            <div style={styles.avatarBox}>
              <div style={styles.avatarLabel}>头像</div>
              <div style={styles.avatarGrid}>
                {defaultAvatars.map((e) => (
                  <span
                    key={e}
                    className="login-avatar"
                    style={avatarFile === null && avatarEmoji === e ? styles.avatarSelected : styles.avatarItem}
                    onClick={() => {
                      setAvatarEmoji(e)
                      setAvatarFile(null)
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              <div style={styles.uploadRow}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button style={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  📷 上传照片
                </button>
                {avatarFile && <span style={styles.fileName}>已选：{avatarFile.name}</span>}
              </div>
            </div>
          )}

          <button
            className="login-main-btn"
            style={styles.btn}
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>

          <div style={styles.switch}>
            {isRegister ? '已有账号？' : '还没有账号？'}
            <span className="login-switch-link" style={styles.switchLink} onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? '去登录' : '去注册'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)'
  },
  // ===== 左品牌区 =====
  left: {
    position: 'relative',
    flex: '1.1 1 52%',
    minWidth: 430,
    background: 'linear-gradient(150deg, #fbdbe5 0%, #f3c4d1 55%, #ec9cb3 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  leftDeco1: {
    position: 'absolute',
    top: -90,
    left: -70,
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'rgba(124,70,88,0.16)'
  },
  leftDeco2: {
    position: 'absolute',
    bottom: -70,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: '50%',
    background: 'rgba(124,70,88,0.14)'
  },
  leftDeco3: {
    position: 'absolute',
    top: '16%',
    right: '14%',
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'rgba(124,70,88,0.2)'
  },
  leftEmoji1: { position: 'absolute', top: '12%', left: '18%', fontSize: 34, opacity: 0.9, transform: 'rotate(-12deg)' },
  leftEmoji2: { position: 'absolute', bottom: '22%', left: '26%', fontSize: 28, opacity: 0.85, transform: 'rotate(10deg)' },
  leftEmoji3: { position: 'absolute', top: '28%', right: '20%', fontSize: 26, opacity: 0.9 },
  leftEmoji4: { position: 'absolute', bottom: '14%', right: '16%', fontSize: 38, opacity: 0.85, transform: 'rotate(8deg)' },
  leftInner: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 30px' },
  logoBox: {
    width: 84,
    height: 84,
    margin: '0 auto',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    boxShadow: '0 12px 32px rgba(221,125,152,.3)'
  },
  brand: {
    color: '#8a5466',
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: 3,
    margin: '20px 0 10px'
  },
  brandSlogan: {
    color: 'rgba(138,84,102,0.85)',
    fontSize: 14.5,
    lineHeight: 1.9,
    margin: 0
  },
  leftFooter: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(138,84,102,0.6)',
    fontSize: 14,
    zIndex: 2
  },
  // ===== 右表单区 =====
  right: {
    flex: '1 1 48%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 28px',
    background: 'var(--bg)'
  },
  form: { width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 14 },
  title: { fontSize: 26, fontWeight: 750, color: 'var(--ink)', margin: 0 },
  subtitle: { fontSize: 13.5, color: 'var(--muted)', margin: '-8px 0 2px' },
  quickBox: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 16,
    padding: '12px 14px',
    boxShadow: '0 4px 14px rgba(67,45,53,.05)'
  },
  quickLabel: { fontSize: 14, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 },
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  quickBtn: {
    padding: '9px 6px',
    fontSize: 12.5,
    borderRadius: 10,
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--accent-strong)',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 600
  },
  input: {
    padding: '12px 14px',
    fontSize: 16,
    borderRadius: 12,
    border: '1px solid var(--line)',
    background: 'var(--surface-soft)',
    outline: 'none',
    color: 'var(--ink)',
    transition: 'border-color .15s, box-shadow .15s'
  },
  avatarBox: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 16,
    padding: '12px 14px'
  },
  avatarLabel: { fontSize: 14, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 },
  avatarGrid: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  avatarItem: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '2px solid var(--line)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 19,
    cursor: 'pointer',
    transition: 'border-color .15s, box-shadow .15s'
  },
  avatarSelected: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '2px solid var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 19,
    cursor: 'pointer',
    boxShadow: '0 0 0 3px rgba(31,31,35,0.12)'
  },
  uploadRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 },
  uploadBtn: {
    padding: '8px 14px',
    fontSize: 15,
    borderRadius: 10,
    border: '1px dashed var(--accent)',
    background: 'var(--surface)',
    color: 'var(--accent-strong)',
    cursor: 'pointer'
  },
  fileName: { fontSize: 14, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  btn: {
    padding: '13px',
    fontSize: 15.5,
    fontWeight: 700,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(31,31,35,0.25)',
    marginTop: 2
  },
  switch: { textAlign: 'center', color: 'var(--muted)', fontSize: 16, marginTop: 2 },
  switchLink: { color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, marginLeft: 4 },
  footer: { textAlign: 'center', fontSize: 14, color: '#b1a7aa', marginTop: 4 }
}

export default Login
