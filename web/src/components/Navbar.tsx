import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getNotifications, getUnreadCount, readAllNotifications, type NotificationItem } from '../api/notification'
import { getMessageUnread } from '../api/message'
import { MessageIcon, SearchIcon, BellIcon } from './icons'

/**
 * 顶部导航栏：导航 + 搜索入口 + 通知铃铛 + 用户信息
 */
function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const nickname = localStorage.getItem('nickname') || '我'
  const avatar = localStorage.getItem('avatar') || ''
  const isAdmin = Number(localStorage.getItem('role')) === 2

  // 通知
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  // 私信未读数
  const [msgUnread, setMsgUnread] = useState(0)

  // 未读数：加载时获取 + 每 30 秒轮询
  useEffect(() => {
    if (isAdmin) return
    const load = async () => {
      const res: any = await getUnreadCount()
      if (res.code === 200) setUnread(res.data.count)
      const mr: any = await getMessageUnread()
      if (mr.code === 200) setMsgUnread(mr.data.count)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    localStorage.removeItem('avatar')
    navigate('/login')
  }

  // 打开/关闭通知弹窗，打开时拉取列表并全部已读
  const toggleNotifs = async () => {
    if (notifOpen) {
      setNotifOpen(false)
      return
    }
    setNotifOpen(true)
    const res: any = await getNotifications()
    if (res.code === 200) {
      setNotifs(res.data)
      await readAllNotifications()
      setUnread(0)
    }
  }

  // 当前页高亮
  const isActive = (path: string) => location.pathname === path

  const tab = (path: string, label: string) => (
    <span
      onClick={() => navigate(path)}
      style={{
        cursor: 'pointer',
        padding: '10px 15px', fontSize: 18,
        fontWeight: isActive(path) ? 700 : 400,
        color: isActive(path) ? 'var(--accent)' : '#333',
        borderBottom: isActive(path) ? '2px solid var(--accent)' : '2px solid transparent'
      }}
    >
      {label}
    </span>
  )

  const avatarEl = (av: string, nm: string, size: number) =>
    av ? (
      av.startsWith('/') || av.startsWith('http') ? (
        <img src={av} alt="头像" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size / 2 }}>{av}</span>
      )
    ) : (
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
        {nm.charAt(0)}
      </span>
    )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate(isAdmin ? '/admin' : '/')}>
        🧸 娃柜日记
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* 普通用户：首页/展示柜/个人主页；管理员：只有管理后台 */}
        {!isAdmin && tab('/', '首页')}
        {!isAdmin && tab('/cabinet', '娃柜')}
        {!isAdmin && tab('/profile', '我的')}
        {isAdmin && tab('/admin', '管理后台')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 普通用户功能：私信 + 搜索 + 通知 */}
        {!isAdmin && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/messages')}>
            <span style={styles.iconBtn} title="私信"><MessageIcon /></span>
            {msgUnread > 0 && (
              <span style={styles.badge}>{msgUnread > 99 ? '99+' : msgUnread}</span>
            )}
          </div>
        )}
        {!isAdmin && (
          <span style={styles.iconBtn} onClick={() => navigate('/search')} title="搜索"><SearchIcon /></span>
        )}
        {!isAdmin && (
          <span style={{ ...styles.iconBtn, fontSize: 18 }} onClick={() => navigate('/ai')} title="AI助手">🤖</span>
        )}
        {!isAdmin && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} onClick={toggleNotifs}>
            <span style={styles.iconBtn} title="通知"><BellIcon /></span>
            {unread > 0 && (
              <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>
            )}
          </div>
        )}
        {avatarEl(avatar, nickname, 30)}
        <span style={{ fontSize: 17 }}>{nickname}</span>
        <button onClick={handleLogout} style={styles.logout}>退出</button>
      </div>

      {/* 通知弹窗 */}
      {!isAdmin && notifOpen && (
        <div style={styles.modalMask} onClick={() => setNotifOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>通知</div>
            <div style={styles.modalBody}>
              {notifs.length === 0 && <p style={styles.modalEmpty}>暂无通知～</p>}
              {notifs.map((n) => (
                <div key={n.id} style={styles.notifRow}>
                  {avatarEl(n.actorAvatar || '', n.actorNickname || '娃', 36)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16 }}>
                      <span style={{ fontWeight: 600 }}>{n.actorNickname || '用户'}</span>
                      {n.type === 'follow' && ' 关注了你'}
                      {n.type === 'like' && ' 赞了你的动态'}
                      {n.type === 'comment' && ' 评论了你的动态'}
                    </div>
                    <div style={{ fontSize: 14, color: '#999', marginTop: 2 }}>
                      {n.createdAt?.replace('T', ' ').slice(0, 16)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  iconBtn: {
    width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface-soft)', color: 'var(--muted)', position: 'relative'
  },
  badge: {
    position: 'absolute', top: -1, right: -2, minWidth: 17, height: 17,
    borderRadius: 9, background: 'var(--accent-strong)', color: '#fff', fontSize: 11,
    lineHeight: '17px', textAlign: 'center', padding: '0 4px', boxSizing: 'border-box',
    border: '2px solid #fff'
  },
  logout: {
    padding: '8px 15px', borderRadius: 10, border: '1px solid var(--line)',
    background: 'var(--surface)', cursor: 'pointer', color: 'var(--muted)', fontSize: 16
  },
  modalMask: {
    position:'fixed', inset:0, zIndex:200, background:'rgba(48,42,44,.22)',
    display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'72px 28px 0 0'
  },
  modalCard: {
    width:350, maxWidth:'90vw', maxHeight:'60vh', background: 'var(--surface)', borderRadius:18,
    overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 18px 50px rgba(48,42,44,.16)'
  },
  modalTitle: { padding:'16px 18px', fontWeight:700, fontSize:16, textAlign:'left', borderBottom:'1px solid var(--line)' },
  modalBody: { overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 },
  notifRow: { display:'flex', alignItems:'center', gap:10, padding:'9px 7px', borderRadius:10 },
  modalEmpty: { textAlign:'center', color:'var(--muted)', padding:'30px 0' }
}

export default Navbar
