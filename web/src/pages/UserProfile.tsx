import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DollDetailModal from '../components/DollDetailModal'
import ImageViewer from '../components/ImageViewer'
import ReportModal from '../components/ReportModal'
import { getUserProfile } from '../api/user'
import { getDollsByUser, type Doll } from '../api/doll'
import { getDynamicsByUser } from '../api/dynamic'
import { toggleFollow } from '../api/follow'

interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar?: string
  intro?: string
  bgImage?: string
  role: number
  dynamicsCount: number
  dollsCount: number
  followingCount: number
  fansCount: number
  isFollowing: boolean
  isMe: boolean
}

interface Dynamic {
  id: number
  userId: number
  nickname: string
  content: string
  images?: string
  createdAt: string
  likeCount: number
  commentCount: number
  // 关联娃娃（同步发布动态时带上）
  dollId?: number
  dollName?: string
  dollImage?: string
  dollPrice?: number
  dollType?: string
}

type TabKey = 'dolls' | 'dynamics'

/**
 * 他人主页：小红书风格，只读展示对方的娃柜和动态，可关注/取关
 */
function UserProfile() {
  const navigate = useNavigate()
  const { id } = useParams()
  const userId = Number(id)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [dolls, setDolls] = useState<Doll[]>([])
  const [dynamics, setDynamics] = useState<Dynamic[]>([])
  const [tab, setTab] = useState<TabKey>('dolls')
  // 娃娃详情弹窗
  const [detailId, setDetailId] = useState<number | null>(null)
  // 动态图片查看大图
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null)
  // 举报弹窗
  const [reportTarget, setReportTarget] = useState<{ type: 'dynamic' | 'comment' | 'user'; targetId: number } | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const load = async () => {
    const uRes: any = await getUserProfile(userId)
    if (uRes.code !== 200) {
      navigate('/')
      return
    }
    setUser(uRes.data)
    // 看的是自己 → 去个人主页
    if (uRes.data.isMe) {
      navigate('/profile')
      return
    }
    const dRes: any = await getDollsByUser(userId)
    if (dRes.code === 200) setDolls(dRes.data)
    const dyRes: any = await getDynamicsByUser(userId)
    if (dyRes.code === 200) setDynamics(dyRes.data)
  }

  const handleFollow = async () => {
    if (!user) return
    const res: any = await toggleFollow(user.id)
    if (res.code === 200) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: res.data.following,
              fansCount: prev.fansCount + (res.data.following ? 1 : -1)
            }
          : prev
      )
    }
  }

  const tabItem = (key: TabKey, label: string, count: number) => (
    <span
      style={tab === key ? styles.tabActive : styles.tab}
      onClick={() => setTab(key)}
    >
      {label}
      <span style={styles.tabCount}>{count}</span>
    </span>
  )

  if (!user) return <div><Navbar /></div>

  return (
    <div style={styles.page}>
      <Navbar />

      {/* 顶部信息卡 */}
      <div style={styles.header}>
        <div style={user.bgImage ? { ...styles.headerBgImg, backgroundImage: `url(${user.bgImage})` } : styles.headerBg} />
        <div style={styles.headerInner}>
          <div style={styles.userRow}>
            <div style={styles.avatarWrap}>
              {user.avatar ? (
                user.avatar.startsWith('/') || user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="头像" style={{ ...styles.avatar, objectFit: 'cover' }} />
                ) : (
                  <span style={{ ...styles.avatar, fontSize: 34 }}>{user.avatar}</span>
                )
              ) : (
                <div style={styles.avatar}>{user.nickname?.charAt(0) || '娃'}</div>
              )}
            </div>
            <div>
              <div style={styles.nickname}>{user.nickname}</div>
              <div style={styles.accountId}>娃柜日记号：{user.username}</div>
              {user.intro && <div style={styles.intro}>{user.intro}</div>}
            </div>
          </div>

          {/* 关注/粉丝统计 */}
          <div style={styles.followStats}>
            <span style={styles.followStat}>关注 <b style={styles.followNum}>{user.followingCount}</b></span>
            <span style={styles.followStat}>粉丝 <b style={styles.followNum}>{user.fansCount}</b></span>
            <span style={styles.followStat}>娃娃 <b style={styles.followNum}>{user.dollsCount}</b></span>
            <span style={styles.followStat}>动态 <b style={styles.followNum}>{user.dynamicsCount}</b></span>
          </div>

          {/* 关注/私信按钮 */}
          <div style={styles.btnRow}>
            <button
              style={user.isFollowing ? styles.followedBtn : styles.followBtn}
              onClick={handleFollow}
            >
              {user.isFollowing ? '已关注' : '+ 关注'}
            </button>
            <button style={styles.msgBtn} onClick={() => navigate(`/messages?otherId=${user.id}`)}>
              💬 发私信
            </button>
            <button style={styles.reportBtn} onClick={() => setReportTarget({ type: 'user', targetId: user.id })}>
              举报
            </button>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div style={styles.tabs}>
        {tabItem('dolls', '娃娃柜', dolls.length)}
        {tabItem('dynamics', '动态', dynamics.length)}
      </div>

      {/* 娃娃柜：双列瀑布流（他人只看公开） */}
      {tab === 'dolls' && (
        <div style={styles.masonry}>
          {dolls.length === 0 && <p style={styles.empty}>TA 的柜子还空着～</p>}
          {dolls.map((d) => (
            <div key={d.id} style={styles.masonryCard} onClick={() => setDetailId(d.id)}>
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.name} style={styles.masonryImg} />
              ) : (
                <div style={styles.masonryPlaceholder}>🐻</div>
              )}
              <div style={styles.masonryInfo}>
                <div style={styles.masonryName}>{d.name}</div>
                <div style={styles.masonryMeta}>
                  {d.type || '未分类'}
                  {d.price != null && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> · ¥{d.price}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 动态 */}
      {tab === 'dynamics' && (
        <div style={styles.listWrap}>
          {dynamics.length === 0 && <p style={styles.empty}>TA 还没有发布过动态</p>}
          {dynamics.map((d) => (
            <div key={d.id} style={styles.listCard}>
              <div style={{ color: '#999', fontSize: 14 }}>
                {d.createdAt?.replace('T', ' ').slice(0, 16)} · ❤️ {d.likeCount} · 💬 {d.commentCount}
              </div>
              <div style={{ marginTop: 6 }}>{d.content}</div>
              {d.images && (
                <div style={styles.listImages}>
                  {d.images.split(',').filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="动态图片" style={styles.listImg} onClick={() => setViewer({ urls: d.images!.split(',').filter(Boolean), index: i })} />
                  ))}
                </div>
              )}
              {/* 关联娃娃小卡片：点击进娃娃详情 */}
              {d.dollId && (
                <div style={styles.dollLink} onClick={() => setDetailId(d.dollId!)}>
                  {d.dollImage ? (
                    <img src={d.dollImage} alt={d.dollName || '娃娃'} style={styles.dollLinkImg} />
                  ) : (
                    <div style={styles.dollLinkImg}>🐻</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{d.dollName || '娃娃'}</div>
                    <div style={{ fontSize: 16, color: '#888' }}>
                      {d.dollType || '未分类'}
                      {d.dollPrice != null && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> · ¥{d.dollPrice}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>查看详情 →</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DollDetailModal dollId={detailId} onClose={() => setDetailId(null)} />
      <ImageViewer images={viewer?.urls ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
      <ReportModal
        open={!!reportTarget}
        type={reportTarget?.type ?? 'dynamic'}
        targetId={reportTarget?.targetId ?? 0}
        onClose={() => setReportTarget(null)}
      />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: '#fafafa' },
  header: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, var(--surface-soft) 0%, var(--line) 60%, #ffc2d4 100%)',
    paddingBottom: 16
  },
  headerBg: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)'
  },
  headerBgImg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.55
  },
  intro: { fontSize: 17, color: '#666', marginTop: 6, maxWidth: 380, lineHeight: '23px' },
  headerInner: { position: 'relative', width: '100%', maxWidth: '100%', margin: '0 auto', padding: '24px 28px 8px' },
  userRow: { display: 'flex', alignItems: 'center', gap: 14 },
  avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '3px solid #fff',
    boxShadow: '0 2px 8px rgba(31,31,35,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--accent)',
    flexShrink: 0
  },
  nickname: { fontSize: 24, fontWeight: 700, color: '#333' },
  accountId: { fontSize: 17, color: '#999', marginTop: 4 },
  followStats: { display: 'flex', gap: 20, marginTop: 14 },
  followStat: { fontSize: 18, color: '#666' },
  followNum: { color: '#333', fontSize: 16, marginLeft: 2 },
  btnRow: { display: 'flex', gap: 10, marginTop: 14 },
  followBtn: {
    padding: '8px 28px',
    borderRadius: 18,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  followedBtn: {
    padding: '8px 28px',
    borderRadius: 18,
    border: '1px solid #e0e0e0',
    background: 'rgba(255,255,255,0.9)',
    color: '#999',
    fontSize: 16,
    cursor: 'pointer'
  },
  msgBtn: {
    padding: '8px 28px',
    borderRadius: 18,
    border: '1px solid var(--accent)',
    background: 'rgba(255,255,255,0.9)',
    color: 'var(--accent)',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  reportBtn: {
    padding: '8px 20px',
    borderRadius: 18,
    border: '1px solid #e0e0e0',
    background: 'rgba(255,255,255,0.9)',
    color: '#888',
    fontSize: 16,
    cursor: 'pointer'
  },
  tabs: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'var(--surface)',
    borderBottom: '1px solid #f0f0f0'
  },
  tab: {
    padding: '7px 18px',
    borderRadius: 16,
    fontSize: 16,
    cursor: 'pointer',
    color: '#666',
    background: '#f5f5f5'
  },
  tabActive: {
    padding: '7px 18px',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#fff',
    background: 'var(--accent)'
  },
  tabCount: { fontSize: 14, marginLeft: 3, opacity: 0.8 },
  masonry: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '16px 28px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12
  },
  masonryCard: {
    background: 'var(--surface)',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  },
  masonryImg: { width: '100%', height: 220, objectFit: 'cover', display: 'block' },
  masonryPlaceholder: {
    width: '100%',
    height: 220,
    background: 'var(--accent-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48
  },
  masonryInfo: { padding: '10px 12px 12px' },
  masonryName: { fontWeight: 600, fontSize: 18, color: '#333' },
  masonryMeta: { fontSize: 17, color: '#999', marginTop: 4 },
  listWrap: { width: '100%', maxWidth: '100%', margin: '0 auto', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 10 },
  listCard: {
    background: 'var(--surface)',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  dollLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    border: '1px solid var(--line)',
    background: 'var(--surface-soft)',
    cursor: 'pointer'
  },
  dollLinkImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    objectFit: 'cover',
    background: 'var(--line)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    flexShrink: 0
  },
  listImages: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  listImg: { width: 120, height: 120, objectFit: 'cover', borderRadius: 8 },
  empty: { textAlign: 'center', color: '#999', padding: '40px 0', gridColumn: '1 / -1' }
}

export default UserProfile
