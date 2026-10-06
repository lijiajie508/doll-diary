import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { searchAll, type SearchUser, type SearchDoll } from '../api/search'

interface SearchDynamic {
  id: number
  userId: number
  nickname: string
  avatar?: string
  content: string
  images?: string
  createdAt: string
  likeCount: number
  commentCount: number
}

type TabKey = 'users' | 'dolls' | 'dynamics'

/**
 * 搜索页：搜用户/娃娃/动态
 */
function Search() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState(false)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [dolls, setDolls] = useState<SearchDoll[]>([])
  const [dynamics, setDynamics] = useState<SearchDynamic[]>([])
  const [tab, setTab] = useState<TabKey>('users')

  const doSearch = async () => {
    if (!keyword.trim()) return
    const res: any = await searchAll(keyword.trim())
    if (res.code === 200) {
      setUsers(res.data.users || [])
      setDolls(res.data.dolls || [])
      setDynamics(res.data.dynamics || [])
      setSearched(true)
      setTab(res.data.users?.length ? 'users' : res.data.dolls?.length ? 'dolls' : 'dynamics')
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

  const avatarOf = (avatar?: string, nickname?: string, size = 40) =>
    avatar ? (
      avatar.startsWith('/') || avatar.startsWith('http') ? (
        <img src={avatar} alt="头像" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size / 2 }}>{avatar}</span>
      )
    ) : (
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
        {nickname?.charAt(0) || '娃'}
      </span>
    )

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.inner}>
        {/* AI 助手入口 */}
        <div style={styles.aiEntry} onClick={() => navigate('/ai')}>
          <span style={styles.aiIcon}>🤖</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#fff' }}>AI 助手</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              问问你的娃娃柜：今天加了什么？哪只最贵？哪买的？
            </div>
          </div>
          <span style={styles.aiGo}>去问问 →</span>
        </div>

        {/* 搜索框 */}
        <div style={styles.searchBar}>
          <input
            style={styles.input}
            placeholder="搜用户 / 搜娃娃 / 搜动态..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          />
          <button style={styles.btn} onClick={doSearch}>搜索</button>
        </div>

        {searched && (
          <>
            <div style={styles.tabs}>
              {tabItem('users', '用户', users.length)}
              {tabItem('dolls', '娃娃', dolls.length)}
              {tabItem('dynamics', '动态', dynamics.length)}
            </div>

            {/* 用户结果 */}
            {tab === 'users' && (
              <div style={styles.list}>
                {users.length === 0 && <p style={styles.empty}>没有找到用户</p>}
                {users.map((u) => (
                  <div key={u.id} style={styles.row} onClick={() => navigate(`/user/${u.id}`)}>
                    {avatarOf(u.avatar, u.nickname)}
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.nickname}</div>
                      <div style={{ fontSize: 14, color: '#999' }}>@{u.username}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 15 }}>看TA的主页 →</span>
                  </div>
                ))}
              </div>
            )}

            {/* 娃娃结果 */}
            {tab === 'dolls' && (
              <div style={styles.grid}>
                {dolls.length === 0 && <p style={styles.empty}>没有找到娃娃</p>}
                {dolls.map((d) => (
                  <div key={d.id} style={styles.dollCard} onClick={() => navigate(`/user/${d.userId}`)}>
                    {d.imageUrl ? (
                      <img src={d.imageUrl} alt={d.name} style={styles.dollImg} />
                    ) : (
                      <div style={styles.dollPlaceholder}>🐻</div>
                    )}
                    <div style={styles.dollInfo}>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 14, color: '#999' }}>{d.type || '未分类'}</div>
                      {d.price != null && <div style={{ color: 'var(--accent)', fontWeight: 600 }}>¥{d.price}</div>}
                      <div style={{ fontSize: 14, color: '#bbb', marginTop: 4 }}>by {d.nickname}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 动态结果 */}
            {tab === 'dynamics' && (
              <div style={styles.list}>
                {dynamics.length === 0 && <p style={styles.empty}>没有找到动态</p>}
                {dynamics.map((d) => (
                  <div key={d.id} style={styles.row} onClick={() => navigate(`/user/${d.userId}`)}>
                    {avatarOf(d.avatar, d.nickname, 36)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, color: '#999' }}>
                        {d.nickname} · {d.createdAt?.replace('T', ' ').slice(0, 16)}
                      </div>
                      <div style={{ marginTop: 4, wordBreak: 'break-word' }}>{d.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searched && <p style={styles.empty}>输入关键词，搜索用户、娃娃和动态～</p>}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  inner: { width: '100%', maxWidth: '100%', margin: '0 auto', padding: '30px 28px 60px' },
  searchBar: { display: 'flex', gap: 10, marginBottom: 20, background: 'var(--surface)', padding:8, borderRadius:18, border:'1px solid #eee6e8', boxShadow:'0 10px 28px rgba(78,48,58,.045)' },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 13,
    border: '1px solid transparent',
    background: 'var(--surface)',
    fontSize: 16,
    outline: 'none'
  },
  btn: {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  tabs: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 8,
    padding: '10px 12px',
    background: 'transparent',
    borderRadius: 14,
    marginBottom: 14
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
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--surface)',
    borderRadius: 12,
    padding: 12,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  dollCard: {
    background: 'var(--surface)',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  dollImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  dollPlaceholder: {
    width: '100%',
    height: 180,
    background: 'var(--accent-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48
  },
  dollInfo: { padding: '10px 12px 12px' },
  empty: { textAlign: 'center', color: '#999', padding: '40px 0' },
  aiEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #f3b5c5, var(--accent))',
    cursor: 'pointer',
    marginBottom: 14,
    boxShadow: '0 2px 8px rgba(31,31,35,0.18)'
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20
  },
  aiGo: { color: '#fff', fontSize: 15, fontWeight: 600 }
}

export default Search
