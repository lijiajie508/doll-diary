import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getUsers, getAdminDynamics, getAdminComments, getAdminDolls, updateUserStatus, getReports, handleReport, getOpLogs } from '../api/admin'
import { deleteDynamic } from '../api/dynamic'
import { getComments, deleteComment } from '../api/comment'
import ImageViewer from '../components/ImageViewer'

type TabKey = 'stats' | 'users' | 'dynamics' | 'comments' | 'dolls' | 'reports' | 'logs'

interface AdminReport {
  id: number
  type: string
  targetId: number
  reason?: string
  status: number
  createdAt: string
  handledAt?: string
  reporterName: string
  targetSummary: string
}

interface OpLogItem {
  id: number
  adminName?: string
  action: string
  targetType?: string
  targetId?: number
  detail?: string
  ip?: string
  result?: string
  createdAt: string
}

interface Stats {
  userCount: number
  dynamicCount: number
  dollCount: number
  commentCount: number
  favoriteCount: number
  todayUserCount: number
  todayDynamicCount: number
  hotDynamics: Array<{ id: number; nickname: string; content: string; createdAt: string; likeCount: number; commentCount: number }>
  activeUsers: Array<{ id: number; nickname: string; dynamicCount: number; commentCount: number; dollCount: number }>
  userTrend?: Array<{ day: string; cnt: number }>
  dynamicTrend?: Array<{ day: string; cnt: number }>
}

interface AdminUser {
  id: number
  username: string
  nickname: string
  role: number
  status: number
  createdAt: string
  dynamicCount: number
  dollCount: number
}

interface AdminDynamic {
  id: number
  userId: number
  nickname: string
  content: string
  images?: string
  createdAt: string
  likeCount: number
  commentCount: number
}

interface AdminComment {
  id: number
  dynamicId: number
  userId: number
  nickname: string
  content: string
  dynamicContent?: string
  createdAt: string
}

interface AdminDoll {
  id: number
  userId: number
  nickname: string
  name: string
  type?: string
  imageUrl?: string
  price?: number
  visible: number
  createdAt: string
}

interface CommentItem {
  id: number
  userId: number
  nickname: string
  content: string
  createdAt: string
}

const MENUS: { key: TabKey; label: string }[] = [
  { key: 'stats', label: '数据看板' },
  { key: 'users', label: '用户管理' },
  { key: 'dynamics', label: '动态管理' },
  { key: 'comments', label: '评论管理' },
  { key: 'dolls', label: '娃娃管理' },
  { key: 'reports', label: '举报处理' },
  { key: 'logs', label: '操作日志' }
]

/**
 * 管理后台（独立后台布局：侧边栏 + 顶栏 + 内容区）
 * 数据看板 + 用户/动态/评论/娃娃管理 + 举报闭环 + 操作日志
 * 路由守卫已保证仅管理员可进入
 */
function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('stats')
  const [stats, setStats] = useState<Stats | null>(null)

  // 用户管理
  const [userList, setUserList] = useState<AdminUser[]>([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userKeyword, setUserKeyword] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // 动态管理
  const [dynamicList, setDynamicList] = useState<AdminDynamic[]>([])
  const [dynamicTotal, setDynamicTotal] = useState(0)
  const [dynamicPage, setDynamicPage] = useState(1)
  const [dynamicKeyword, setDynamicKeyword] = useState('')
  const [dynamicSearch, setDynamicSearch] = useState('')

  // 评论管理
  const [commentList, setCommentList] = useState<AdminComment[]>([])
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentPage, setCommentPage] = useState(1)
  const [commentKeyword, setCommentKeyword] = useState('')
  const [commentSearch, setCommentSearch] = useState('')

  // 娃娃管理
  const [dollList, setDollList] = useState<AdminDoll[]>([])
  const [dollTotal, setDollTotal] = useState(0)
  const [dollPage, setDollPage] = useState(1)
  const [dollKeyword, setDollKeyword] = useState('')
  const [dollSearch, setDollSearch] = useState('')

  // 两段确认（原 window.confirm 在嵌入式环境被禁用）
  const [confirmUserId, setConfirmUserId] = useState<number | null>(null)
  const [confirmDynId, setConfirmDynId] = useState<number | null>(null)
  const [confirmCommentId, setConfirmCommentId] = useState<number | null>(null)

  // 举报管理
  const [reportList, setReportList] = useState<AdminReport[]>([])
  const [reportTotal, setReportTotal] = useState(0)
  const [reportPage, setReportPage] = useState(1)
  const [reportStatus, setReportStatus] = useState<number | undefined>(0)
  const [confirmReport, setConfirmReport] = useState<{ id: number; action: string } | null>(null)

  // 操作日志
  const [logList, setLogList] = useState<OpLogItem[]>([])
  const [logTotal, setLogTotal] = useState(0)
  const [logPage, setLogPage] = useState(1)

  // 动态图片查看 + 评论弹窗（管理员审核内容用）
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null)
  const [commentView, setCommentView] = useState<{ dynamicId: number; list: CommentItem[] } | null>(null)

  useEffect(() => {
    loadStats()
    loadUsers(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStats = async () => {
    const res: any = await getStats()
    if (res.code === 200) setStats(res.data)
  }

  const loadUsers = async (p: number, kw: string) => {
    const res: any = await getUsers({ page: p, size: 10, keyword: kw || undefined })
    if (res.code === 200) {
      setUserList(res.data.list)
      setUserTotal(res.data.total)
      setUserPage(res.data.page)
    }
  }

  const loadDynamics = async (p: number, kw: string) => {
    const res: any = await getAdminDynamics({ page: p, size: 10, keyword: kw || undefined })
    if (res.code === 200) {
      setDynamicList(res.data.list)
      setDynamicTotal(res.data.total)
      setDynamicPage(res.data.page)
    }
  }

  const loadComments = async (p: number, kw: string) => {
    const res: any = await getAdminComments({ page: p, size: 10, keyword: kw || undefined })
    if (res.code === 200) {
      setCommentList(res.data.list)
      setCommentTotal(res.data.total)
      setCommentPage(res.data.page)
    }
  }

  const loadDolls = async (p: number, kw: string) => {
    const res: any = await getAdminDolls({ page: p, size: 10, keyword: kw || undefined })
    if (res.code === 200) {
      setDollList(res.data.list)
      setDollTotal(res.data.total)
      setDollPage(res.data.page)
    }
  }

  const loadReports = async (p: number, status?: number) => {
    const res: any = await getReports({ page: p, size: 10, status })
    if (res.code === 200) {
      setReportList(res.data.list)
      setReportTotal(res.data.total)
      setReportPage(res.data.page)
    }
  }

  const loadLogs = async (p: number) => {
    const res: any = await getOpLogs({ page: p, size: 10 })
    if (res.code === 200) {
      setLogList(res.data.list)
      setLogTotal(res.data.total)
      setLogPage(res.data.page)
    }
  }

  // 切换 tab：统计卡片点击也走这里，进入列表时懒加载
  const switchTab = (t: TabKey) => {
    setTab(t)
    if (t === 'dynamics' && dynamicList.length === 0) loadDynamics(1, '')
    if (t === 'comments' && commentList.length === 0) loadComments(1, '')
    if (t === 'dolls' && dollList.length === 0) loadDolls(1, '')
    if (t === 'reports' && reportList.length === 0) loadReports(1, reportStatus)
    if (t === 'logs' && logList.length === 0) loadLogs(1)
  }

  // 退出登录（管理员直接回登录页）
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    localStorage.removeItem('avatar')
    navigate('/login')
  }

  // 用户：封禁/解封（两段确认）
  const handleUserStatus = async (u: AdminUser) => {
    if (confirmUserId !== u.id) {
      setConfirmUserId(u.id)
      return
    }
    setConfirmUserId(null)
    const res: any = await updateUserStatus(u.id, u.status === 1 ? 0 : 1)
    if (res.code === 200) {
      alert('操作成功')
      loadUsers(userPage, userSearch)
    } else {
      alert(res.message)
    }
  }

  // 动态：删除（内容治理，两段确认）
  const handleDeleteDynamic = async (d: AdminDynamic) => {
    if (confirmDynId !== d.id) {
      setConfirmDynId(d.id)
      return
    }
    setConfirmDynId(null)
    const res: any = await deleteDynamic(d.id)
    if (res.code === 200) {
      alert('已删除')
      loadDynamics(dynamicPage, dynamicSearch)
      loadStats()
    }
  }

  // 评论：删除（内容治理，两段确认）
  const handleDeleteComment = async (c: AdminComment) => {
    if (confirmCommentId !== c.id) {
      setConfirmCommentId(c.id)
      return
    }
    setConfirmCommentId(null)
    const res: any = await deleteComment(c.id)
    if (res.code === 200) {
      alert('已删除')
      loadComments(commentPage, commentSearch)
      loadStats()
    }
  }

  // 打开某条动态的评论弹窗
  const openComments = async (d: AdminDynamic) => {
    const res: any = await getComments(d.id)
    setCommentView({ dynamicId: d.id, list: res.code === 200 ? res.data : [] })
  }

  // 评论弹窗内删除评论
  const deleteCommentInView = async (c: CommentItem) => {
    await deleteComment(c.id)
    if (commentView) {
      const res: any = await getComments(commentView.dynamicId)
      setCommentView({ ...commentView, list: res.code === 200 ? res.data : [] })
    }
    loadStats()
  }

  // 举报：处理（忽略/删除内容/封禁用户，两段确认）
  const handleReportAction = async (r: AdminReport, action: 'ignore' | 'delete' | 'ban') => {
    if (!confirmReport || confirmReport.id !== r.id || confirmReport.action !== action) {
      setConfirmReport({ id: r.id, action })
      return
    }
    setConfirmReport(null)
    const res: any = await handleReport(r.id, action)
    if (res.code === 200) {
      alert('处理成功')
      loadReports(reportPage, reportStatus)
    } else {
      alert(res.message)
    }
  }

  // 近 7 天趋势柱状图（CSS 自绘）
  const trendChart = (data: Array<{ day: string; cnt: number }> | undefined, label: string, color: string) => {
    const list = data || []
    const max = Math.max(1, ...list.map((d) => d.cnt))
    return (
      <div style={styles.section}>
        <div style={styles.sectionTitle}>{label}</div>
        {list.length === 0 && <p style={{ color: '#999' }}>暂无数据</p>}
        <div style={styles.trendChart}>
          {list.map((d) => (
            <div key={d.day} style={styles.trendCol}>
              <div style={{ ...styles.trendBar, height: `${(d.cnt / max) * 110}px`, background: color }}>
                {d.cnt > 0 && d.cnt}
              </div>
              <div style={styles.trendDay}>{d.day.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 统计卡片配置（可点击进对应列表）
  const statCards = stats
    ? [
        { label: '用户总数', value: stats.userCount, to: 'users' as TabKey | null },
        { label: '动态总数', value: stats.dynamicCount, to: 'dynamics' as TabKey | null },
        { label: '娃娃总数', value: stats.dollCount, to: 'dolls' as TabKey | null },
        { label: '评论总数', value: stats.commentCount, to: 'comments' as TabKey | null }
      ]
    : []

  // 通用分页条
  const pagination = (page: number, total: number, onPrev: () => void, onNext: () => void) => {
    const totalPages = Math.max(1, Math.ceil(total / 10))
    return (
      <div style={styles.pageRow}>
        <button style={styles.pageBtn} disabled={page <= 1} onClick={onPrev}>上一页</button>
        <span style={{ fontSize: 15, color: '#888' }}>第 {page} 页 / 共 {totalPages} 页（{total} 条）</span>
        <button style={styles.pageBtn} disabled={page >= totalPages} onClick={onNext}>下一页</button>
      </div>
    )
  }

  // 通用搜索框
  const searchBox = (
    keyword: string,
    setKeyword: (v: string) => void,
    onSearch: () => void,
    placeholder: string
  ) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      <input
        style={styles.input}
        placeholder={placeholder}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <button style={styles.btn} onClick={onSearch}>搜索</button>
    </div>
  )

  // 状态标签
  const statusTag = (text: string, color: string) => (
    <span style={{ ...styles.tag, background: `${color}1a`, color }}>{text}</span>
  )

  // 操作类型中文名
  const actionLabel = (a: string) =>
    ({ ban_user: '封禁/解封用户', delete_dynamic: '删除动态', delete_comment: '删除评论', handle_report: '处理举报' }[a] || a)

  return (
    <div style={styles.layout}>
      {/* ===== 侧边栏 ===== */}
      <aside style={styles.sidebar}>
        <div style={styles.logo} onClick={() => switchTab('stats')}>
          <span style={styles.logoMark}>DS</span>
          <span>娃柜日记管理后台</span>
        </div>
        <nav style={styles.menu}>
          {MENUS.map((m) => (
            <div
              key={m.key}
              style={tab === m.key ? styles.menuItemActive : styles.menuItem}
              onClick={() => switchTab(m.key)}
            >
              {m.label}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFoot}>v1.0 · Doll Share</div>
      </aside>

      {/* ===== 右侧主区 ===== */}
      <div style={styles.main}>
        {/* 顶栏 */}
        <header style={styles.topbar}>
          <div style={styles.pageTitle}>{MENUS.find((m) => m.key === tab)?.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={styles.adminChip}>{localStorage.getItem('nickname') || '管理员'}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>退出登录</button>
          </div>
        </header>

        {/* 内容区 */}
        <div style={styles.content}>
          {/* ============ 数据看板 ============ */}
          {tab === 'stats' && (
            <div>
              <div style={styles.cardGrid}>
                {statCards.map((s) => (
                  <div
                    key={s.label}
                    className="admin-card"
                    style={{ ...styles.card, cursor: s.to ? 'pointer' : 'default' }}
                    onClick={() => s.to && switchTab(s.to)}
                    title={s.to ? `点击查看${s.label}` : undefined}
                  >
                    <div style={styles.cardValue}>{s.value}</div>
                    <div style={styles.cardLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 近 7 天注册趋势 */}
              <div style={{ marginBottom: 20 }}>
                {trendChart(stats?.userTrend, '近 7 天注册趋势', 'linear-gradient(180deg, #60a5fa, #2563eb)')}
              </div>

              {/* 热门动态 */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>热门动态 Top5</div>
                {stats?.hotDynamics.length === 0 && <p style={{ color: '#999' }}>暂无动态</p>}
                {stats?.hotDynamics.map((d, i) => (
                  <div key={d.id} style={styles.rankRow}>
                    <span style={{ ...styles.rank, background: i < 3 ? '#2563eb' : '#f5f5f5', color: i < 3 ? '#fff' : '#999' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{d.nickname}</div>
                      <div style={{ fontSize: 15, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.content}</div>
                    </div>
                    <span style={{ fontSize: 15, color: '#888', whiteSpace: 'nowrap' }}>赞 {d.likeCount} · 评 {d.commentCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============ 用户管理 ============ */}
          {tab === 'users' && (
            <div style={styles.section}>
              <div style={styles.sectionHead}>
                <span style={styles.sectionTitle}>用户列表</span>
                {searchBox(userKeyword, setUserKeyword, () => { setUserSearch(userKeyword); loadUsers(1, userKeyword) }, '搜索用户名 / 昵称')}
              </div>
              <table className="admin-table" style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户名</th>
                    <th>昵称</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>注册时间</th>
                    <th>动态</th>
                    <th>娃娃</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: '#999', padding: 24 }}>没有找到用户</td></tr>
                  )}
                  {userList.map((u, i) => (
                    <tr key={u.id} style={i % 2 ? styles.rowAlt : undefined}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.nickname}</td>
                      <td>{u.role === 2 ? statusTag('管理员', '#7c3aed') : statusTag('用户', '#0ea5e9')}</td>
                      <td>{u.status === 1 ? statusTag('正常', '#10b981') : statusTag('已封禁', '#ef4444')}</td>
                      <td>{u.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                      <td>{u.dynamicCount}</td>
                      <td>{u.dollCount}</td>
                      <td>
                        {u.role !== 2 && (
                          <button
                            style={u.status === 1 ? styles.banBtn : styles.unbanBtn}
                            onClick={() => handleUserStatus(u)}
                          >
                            {confirmUserId === u.id
                              ? (u.status === 1 ? '确认封禁？' : '确认解封？')
                              : (u.status === 1 ? '封禁' : '解封')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination(userPage, userTotal,
                () => { setUserSearch(userSearch); loadUsers(userPage - 1, userSearch) },
                () => { setUserSearch(userSearch); loadUsers(userPage + 1, userSearch) })}
            </div>
          )}

          {/* ============ 动态管理 ============ */}
          {tab === 'dynamics' && (
            <div style={styles.section}>
              {searchBox(dynamicKeyword, setDynamicKeyword, () => { setDynamicSearch(dynamicKeyword); loadDynamics(1, dynamicKeyword) }, '搜索动态内容 / 作者昵称')}
              <table className="admin-table" style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>作者</th>
                    <th>内容</th>
                    <th>图片</th>
                    <th>发布时间</th>
                    <th>点赞</th>
                    <th>评论</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicList.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: 24 }}>没有找到动态</td></tr>
                  )}
                  {dynamicList.map((d, i) => {
                    const imgs = d.images ? d.images.split(',').filter(Boolean) : []
                    return (
                      <tr key={d.id} style={i % 2 ? styles.rowAlt : undefined}>
                        <td>{d.id}</td>
                        <td>{d.nickname}</td>
                        <td style={{ maxWidth: 300 }}>{d.content}</td>
                        <td>
                          {imgs.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              {imgs.slice(0, 2).map((url, j) => (
                                <img
                                  key={j}
                                  src={url}
                                  alt="动态图片"
                                  style={styles.dynImg}
                                  onClick={() => setViewer({ urls: imgs, index: j })}
                                  title="点击查看大图"
                                />
                              ))}
                              {imgs.length > 2 && <span style={styles.dynMore}>+{imgs.length - 2}</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: 14, color: '#bbb' }}>无</span>
                          )}
                        </td>
                        <td>{d.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                        <td>赞 {d.likeCount}</td>
                        <td>
                          <span style={styles.cmtCountBtn} onClick={() => openComments(d)}>
                            评 {d.commentCount}
                          </span>
                        </td>
                        <td>
                          <button style={confirmDynId === d.id ? styles.banBtn : styles.delBtn} onClick={() => handleDeleteDynamic(d)}>
                            {confirmDynId === d.id ? '确认删除？' : '删除'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {pagination(dynamicPage, dynamicTotal,
                () => { setDynamicSearch(dynamicSearch); loadDynamics(dynamicPage - 1, dynamicSearch) },
                () => { setDynamicSearch(dynamicSearch); loadDynamics(dynamicPage + 1, dynamicSearch) })}
            </div>
          )}

          {/* ============ 评论管理 ============ */}
          {tab === 'comments' && (
            <div style={styles.section}>
              {searchBox(commentKeyword, setCommentKeyword, () => { setCommentSearch(commentKeyword); loadComments(1, commentKeyword) }, '搜索评论内容 / 评论者昵称')}
              <table className="admin-table" style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>评论者</th>
                    <th>评论内容</th>
                    <th>所属动态</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {commentList.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: 24 }}>没有找到评论</td></tr>
                  )}
                  {commentList.map((c, i) => (
                    <tr key={c.id} style={i % 2 ? styles.rowAlt : undefined}>
                      <td>{c.id}</td>
                      <td>{c.nickname}</td>
                      <td style={{ maxWidth: 240 }}>{c.content}</td>
                      <td style={{ maxWidth: 240, fontSize: 15, color: '#888' }}>{c.dynamicContent || '—'}</td>
                      <td>{c.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                      <td>
                        <button style={confirmCommentId === c.id ? styles.banBtn : styles.delBtn} onClick={() => handleDeleteComment(c)}>
                          {confirmCommentId === c.id ? '确认删除？' : '删除'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination(commentPage, commentTotal,
                () => { setCommentSearch(commentSearch); loadComments(commentPage - 1, commentSearch) },
                () => { setCommentSearch(commentSearch); loadComments(commentPage + 1, commentSearch) })}
            </div>
          )}

          {/* ============ 娃娃管理 ============ */}
          {tab === 'dolls' && (
            <div style={styles.section}>
              {searchBox(dollKeyword, setDollKeyword, () => { setDollSearch(dollKeyword); loadDolls(1, dollKeyword) }, '搜索娃娃名字 / 拥有者昵称')}
              <table className="admin-table" style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>拥有者</th>
                    <th>名字</th>
                    <th>种类</th>
                    <th>价格</th>
                    <th>可见性</th>
                    <th>添加时间</th>
                  </tr>
                </thead>
                <tbody>
                  {dollList.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 24 }}>没有找到娃娃</td></tr>
                  )}
                  {dollList.map((d, i) => (
                    <tr key={d.id} style={i % 2 ? styles.rowAlt : undefined}>
                      <td>{d.id}</td>
                      <td>{d.nickname}</td>
                      <td>{d.name}</td>
                      <td>{d.type || '未分类'}</td>
                      <td>{d.price != null ? `¥${d.price}` : '—'}</td>
                      <td>{d.visible === 1 ? statusTag('🔒 仅自己可见', '#f59e0b') : statusTag('公开', '#10b981')}</td>
                      <td>{d.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination(dollPage, dollTotal,
                () => { setDollSearch(dollSearch); loadDolls(dollPage - 1, dollSearch) },
                () => { setDollSearch(dollSearch); loadDolls(dollPage + 1, dollSearch) })}
            </div>
          )}

          {/* ============ 举报管理 ============ */}
          {tab === 'reports' && (
            <div>
              {/* 状态筛选 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span style={reportStatus === undefined ? styles.filterActive : styles.filter} onClick={() => { setReportStatus(undefined); loadReports(1, undefined) }}>全部</span>
                <span style={reportStatus === 0 ? styles.filterActive : styles.filter} onClick={() => { setReportStatus(0); loadReports(1, 0) }}>待处理</span>
                <span style={reportStatus === 1 ? styles.filterActive : styles.filter} onClick={() => { setReportStatus(1); loadReports(1, 1) }}>已处理</span>
                <span style={reportStatus === 2 ? styles.filterActive : styles.filter} onClick={() => { setReportStatus(2); loadReports(1, 2) }}>已忽略</span>
              </div>
              <div style={styles.section}>
                <table className="admin-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>类型</th>
                      <th>被举报对象</th>
                      <th>举报人</th>
                      <th>原因</th>
                      <th>时间</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportList.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无举报</td></tr>
                    )}
                    {reportList.map((r, i) => (
                      <tr key={r.id} style={i % 2 ? styles.rowAlt : undefined}>
                        <td>{r.id}</td>
                        <td>{r.type === 'dynamic' ? statusTag('动态', '#7c3aed') : r.type === 'comment' ? statusTag('评论', '#0ea5e9') : statusTag('用户', '#f59e0b')}</td>
                        <td style={{ maxWidth: 200, fontSize: 15 }}>{r.targetSummary}</td>
                        <td>{r.reporterName}</td>
                        <td style={{ maxWidth: 160, fontSize: 15, color: '#888' }}>{r.reason || '—'}</td>
                        <td>{r.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                        <td>
                          {r.status === 0 ? statusTag('待处理', '#ef4444') : r.status === 1 ? statusTag('已处理', '#10b981') : statusTag('已忽略', '#9ca3af')}
                        </td>
                        <td>
                          {r.status === 0 ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                style={confirmReport?.id === r.id && confirmReport.action === 'ignore' ? styles.unbanBtn : styles.delBtn}
                                onClick={() => handleReportAction(r, 'ignore')}
                              >
                                {confirmReport?.id === r.id && confirmReport.action === 'ignore' ? '确认忽略？' : '忽略'}
                              </button>
                              <button
                                style={confirmReport?.id === r.id && confirmReport.action === 'delete' ? styles.banBtn : styles.delBtn}
                                onClick={() => handleReportAction(r, 'delete')}
                              >
                                {confirmReport?.id === r.id && confirmReport.action === 'delete' ? '确认删除？' : '删除'}
                              </button>
                              <button
                                style={confirmReport?.id === r.id && confirmReport.action === 'ban' ? styles.banBtn : styles.delBtn}
                                onClick={() => handleReportAction(r, 'ban')}
                              >
                                {confirmReport?.id === r.id && confirmReport.action === 'ban' ? '确认封禁？' : '封禁'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 14, color: '#999' }}>已处理</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pagination(reportPage, reportTotal,
                  () => loadReports(reportPage - 1, reportStatus),
                  () => loadReports(reportPage + 1, reportStatus))}
              </div>
            </div>
          )}

          {/* ============ 操作日志 ============ */}
          {tab === 'logs' && (
            <div style={styles.section}>
              <div style={styles.sectionHead}>
                <span style={styles.sectionTitle}>操作日志</span>
                <span style={{ fontSize: 15, color: '#94a3b8' }}>管理员每一次后台操作都会记录（封禁、删除内容、处理举报）</span>
              </div>
              <table className="admin-table" style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>管理员</th>
                    <th>操作</th>
                    <th>对象</th>
                    <th>详情</th>
                    <th>IP</th>
                    <th>结果</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logList.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无操作记录</td></tr>
                  )}
                  {logList.map((l, i) => (
                    <tr key={l.id} style={i % 2 ? styles.rowAlt : undefined}>
                      <td>{l.id}</td>
                      <td>{l.adminName || '—'}</td>
                      <td>{actionLabel(l.action)}</td>
                      <td>{l.targetType ? `${l.targetType}#${l.targetId}` : '—'}</td>
                      <td style={{ maxWidth: 240, fontSize: 15 }}>{l.detail || '—'}</td>
                      <td>{l.ip || '—'}</td>
                      <td>{l.result === '成功' ? statusTag('成功', '#10b981') : l.result === '失败' ? statusTag('失败', '#ef4444') : (l.result || '—')}</td>
                      <td>{l.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination(logPage, logTotal,
                () => loadLogs(logPage - 1),
                () => loadLogs(logPage + 1))}
            </div>
          )}
        </div>
      </div>

      {/* 动态评论弹窗（管理员查看/删除） */}
      {commentView && (
        <div style={styles.modalMask} onClick={() => setCommentView(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              动态 #{commentView.dynamicId} 的评论（{commentView.list.length}）
            </div>
            <div style={styles.modalBody}>
              {commentView.list.length === 0 && <p style={styles.modalEmpty}>暂无评论</p>}
              {commentView.list.map((c) => (
                <div key={c.id} style={styles.cmtRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{c.nickname}</span>
                      <span style={{ fontSize: 14, color: '#94a3b8', marginLeft: 8 }}>
                        {c.createdAt?.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, marginTop: 3, wordBreak: 'break-word' }}>{c.content}</div>
                  </div>
                  <button style={styles.delBtn} onClick={() => deleteCommentInView(c)}>删除</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <ImageViewer images={viewer?.urls ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  // 整体布局
  layout: { display: 'flex', minHeight: '100vh', background: '#f7f8fa' },
  // 侧边栏（深色）
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#1e293b',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 20px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700
  },
  menu: { flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 },
  menuItem: {
    padding: '11px 20px',
    cursor: 'pointer',
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    borderLeft: '3px solid transparent',
    transition: 'background 0.15s, color 0.15s'
  },
  menuItemActive: {
    padding: '11px 20px',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    background: 'rgba(37,99,235,0.35)',
    borderLeft: '3px solid #60a5fa'
  },
  sidebarFoot: { padding: '16px 20px', fontSize: 14, color: 'rgba(255,255,255,0.35)', borderTop: '1px solid rgba(255,255,255,0.08)' },
  // 主区
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 28px',
    background: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  pageTitle: { fontSize: 18, fontWeight: 700, color: '#333' },
  adminChip: {
    padding: '6px 14px',
    borderRadius: 6,
    background: '#f1f5f9',
    color: '#334155',
    fontSize: 15,
    fontWeight: 600
  },
  logoutBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 15
  },
  content: { padding: '24px 28px', flex: 1 },
  // 统计卡片
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 },
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s, box-shadow 0.15s'
  },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#1e293b', lineHeight: 1.1 },
  cardLabel: { fontSize: 15, color: '#94a3b8', marginTop: 6 },
  // 区块
  section: { background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 14 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  // 表格
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 16 },
  rowAlt: { background: '#fafafa' },
  // 排行榜
  rankRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid #f5f5f5' },
  rank: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0
  },
  // 输入 & 按钮
  input: { flex: 1, padding: '8px 12px', fontSize: 16, borderRadius: 6, border: '1px solid #e2e8f0', outline: 'none' },
  btn: { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  pageRow: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14, alignItems: 'center' },
  pageBtn: { padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 15 },
  banBtn: { padding: '5px 14px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 15 },
  unbanBtn: { padding: '5px 14px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 15 },
  delBtn: { padding: '5px 14px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 15 },
  // 筛选 pill
  filter: { padding: '7px 18px', borderRadius: 6, cursor: 'pointer', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', fontSize: 15 },
  filterActive: { padding: '7px 18px', borderRadius: 6, cursor: 'pointer', color: '#fff', background: '#2563eb', border: '1px solid #2563eb', fontSize: 15, fontWeight: 600 },
  // 状态标签
  tag: { padding: '3px 10px', borderRadius: 10, fontSize: 14, fontWeight: 600, display: 'inline-block' },
  // 趋势柱状图
  trendChart: { display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, paddingTop: 10 },
  trendCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' },
  trendBar: {
    width: '70%',
    maxWidth: 40,
    minHeight: 3,
    borderRadius: '6px 6px 0 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    fontSize: 11,
    color: '#fff',
    paddingTop: 3,
    boxSizing: 'border-box'
  },
  trendDay: { fontSize: 11, color: '#999' },
  // 动态管理：图片缩略图 + 评论数
  dynImg: {
    width: 52,
    height: 52,
    objectFit: 'cover',
    borderRadius: 6,
    cursor: 'zoom-in',
    display: 'block'
  },
  dynMore: {
    width: 52,
    height: 52,
    borderRadius: 6,
    background: '#f1f5f9',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600
  },
  cmtCountBtn: {
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 6,
    background: '#eff6ff'
  },
  // 评论弹窗
  modalMask: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCard: {
    width: 480,
    maxWidth: '92vw',
    maxHeight: '70vh',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
  },
  modalTitle: {
    padding: '14px 18px',
    fontWeight: 700,
    fontSize: 16,
    borderBottom: '1px solid #f1f5f9',
    color: '#1e293b'
  },
  modalBody: { overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  cmtRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: 8
  },
  modalEmpty: { textAlign: 'center', color: '#94a3b8', padding: '30px 0' }
}

export default Admin
