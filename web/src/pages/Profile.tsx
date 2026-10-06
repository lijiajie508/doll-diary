import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import DollDetailModal from '../components/DollDetailModal'
import ImageViewer from '../components/ImageViewer'
import { compressImage } from '../utils/compress'
import { getDynamicsByUser } from '../api/dynamic'
import { getMyDolls, type Doll } from '../api/doll'
import { getMe, updateAvatar, updateProfile, getMyStats } from '../api/user'
import { getMyComments } from '../api/comment'
import { getMyLikedDynamics } from '../api/favorite'
import { getFollowing, getFans, getFollowCounts, toggleFollow, type FollowUser } from '../api/follow'

interface Dynamic {
  id: number
  userId: number
  nickname: string
  content: string
  images?: string
  createdAt: string
  likeCount: number
  commentCount: number
}

interface MyComment {
  id: number
  dynamicId: number
  content: string
  createdAt: string
  dynamicContent?: string
  dynamicAuthorName?: string
}

type TabKey = 'dolls' | 'dynamics' | 'comments' | 'likes'

/**
 * 个人主页（小红书/抖音风格）：顶部个人信息卡 + 内容 Tab + 双列娃柜瀑布流
 * 娃柜是主页重点内容，默认展示；路由守卫已保证仅普通用户可进入
 */
function Profile() {
  const [tab, setTab] = useState<TabKey>('dolls')
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [myAvatar, setMyAvatar] = useState('')
  // 个人资料：简介/背景图
  const [myIntro, setMyIntro] = useState('')
  const [myBg, setMyBg] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editIntro, setEditIntro] = useState('')
  const [bgFile, setBgFile] = useState<File | null>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  // 年度报告
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState<any>(null)
  // 换头像
  const defaultAvatars = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼']
  const [showAvatarEdit, setShowAvatarEdit] = useState(false)
  const [avatarEmoji, setAvatarEmoji] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [myDynamics, setMyDynamics] = useState<Dynamic[]>([])
  const [myDolls, setMyDolls] = useState<Doll[]>([])
  const [myComments, setMyComments] = useState<MyComment[]>([])
  const [myLikes, setMyLikes] = useState<Dynamic[]>([])
  // 关注/粉丝
  const [followingCount, setFollowingCount] = useState(0)
  const [fansCount, setFansCount] = useState(0)
  const [listModal, setListModal] = useState<'following' | 'fans' | null>(null)
  const [listData, setListData] = useState<FollowUser[]>([])
  // 娃娃详情弹窗
  const [detailId, setDetailId] = useState<number | null>(null)
  // 动态图片查看大图
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const meRes: any = await getMe()
    if (meRes.code === 200) {
      setNickname(meRes.data.nickname)
      setUsername(meRes.data.username)
      setMyAvatar(meRes.data.avatar || '')
      setMyIntro(meRes.data.intro || '')
      setMyBg(meRes.data.bgImage || '')
      setEditNickname(meRes.data.nickname || '')
      setEditIntro(meRes.data.intro || '')
    }

    // 自己的动态用 byUser 接口（feed 已分页，不再全量返回）
    const dynRes: any = meRes.data?.id ? await getDynamicsByUser(meRes.data.id) : null
    if (dynRes?.code === 200) setMyDynamics(dynRes.data)
    const dollRes: any = await getMyDolls()
    if (dollRes.code === 200) setMyDolls(dollRes.data)

    const commentRes: any = await getMyComments()
    if (commentRes.code === 200) setMyComments(commentRes.data)

    const likeRes: any = await getMyLikedDynamics()
    if (likeRes.code === 200) setMyLikes(likeRes.data)

    const followRes: any = await getFollowCounts()
    if (followRes.code === 200) {
      setFollowingCount(followRes.data.followingCount)
      setFansCount(followRes.data.fansCount)
    }
  }

  // 打开关注/粉丝列表
  const openList = async (type: 'following' | 'fans') => {
    setListModal(type)
    setListData([])
    const res: any = type === 'following' ? await getFollowing() : await getFans()
    if (res.code === 200) setListData(res.data)
  }

  // 列表内关注/取关，完成后刷新计数
  const toggleFromList = async (u: FollowUser) => {
    const res: any = await toggleFollow(u.id)
    if (res.code === 200) {
      setListData(listData.map((x) => (x.id === u.id ? { ...x, following: res.data.following } : x)))
      const c: any = await getFollowCounts()
      if (c.code === 200) {
        setFollowingCount(c.data.followingCount)
        setFansCount(c.data.fansCount)
      }
    }
  }

  // 换头像：选默认 emoji 立即保存
  const saveEmojiAvatar = async (e: string) => {
    const res: any = await updateAvatar({ avatar: e })
    if (res.code === 200) {
      setMyAvatar(e)
      localStorage.setItem('avatar', e)
      setShowAvatarEdit(false)
    }
  }

  // 换头像：上传图片后保存（自动压缩到 400px）
  const handleAvatarFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 400, 0.85)
    const res: any = await updateAvatar({ avatarFile: compressed })
    if (res.code === 200) {
      setMyAvatar(res.data)
      localStorage.setItem('avatar', res.data)
      setShowAvatarEdit(false)
    }
  }

  // 保存个人资料（昵称/简介/背景图，背景图自动压缩到 1600px）
  const saveProfile = async () => {
    if (!editNickname.trim()) {
      alert('昵称不能为空')
      return
    }
    const bg = bgFile ? await compressImage(bgFile, 1600, 0.85) : undefined
    const res: any = await updateProfile({
      nickname: editNickname,
      intro: editIntro,
      bgFile: bg
    })
    if (res.code === 200) {
      setNickname(editNickname)
      setMyIntro(editIntro)
      localStorage.setItem('nickname', editNickname)
      setShowEditProfile(false)
      setBgFile(null)
      load()
    } else {
      alert(res.message)
    }
  }

  // 打开年度报告
  const openReport = async () => {
    setShowReport(true)
    if (!report) {
      const res: any = await getMyStats()
      if (res.code === 200) setReport(res.data)
    }
  }

  const tabItem = (key: TabKey, label: string, count?: number) => (
    <span
      style={tab === key ? styles.tabActive : styles.tab}
      onClick={() => setTab(key)}
    >
      {label}
      {count != null && <span style={styles.tabCount}>{count}</span>}
    </span>
  )

  return (
    <div style={styles.page}>
      <Navbar />

      {/* ===== 顶部个人信息卡（小红书风格） ===== */}
      <div style={styles.header}>
        {/* 背景：自定义背景图或默认渐变 */}
        <div style={myBg ? { ...styles.headerBgImg, backgroundImage: `url(${myBg})` } : styles.headerBg} />

        <div style={styles.headerInner}>
          {/* 头像 + 昵称 + 账号号 */}
          <div style={styles.userRow}>
            <div style={styles.avatarWrap}>
              {myAvatar ? (
                myAvatar.startsWith('/') || myAvatar.startsWith('http') ? (
                  <img src={myAvatar} alt="头像" style={{ ...styles.avatar, objectFit: 'cover' }} />
                ) : (
                  <span style={{ ...styles.avatar, fontSize: 34 }}>{myAvatar}</span>
                )
              ) : (
                <div style={styles.avatar}>{nickname?.charAt(0) || '我'}</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.nickname}>{nickname}</div>
              <div style={styles.accountId}>娃柜日记号：{username}</div>
              {myIntro && <div style={styles.intro}>{myIntro}</div>}
              {/* 操作按钮：横向排列 */}
              <div style={styles.btnRow}>
                <button style={styles.changeAvatarBtn} onClick={() => setShowAvatarEdit(!showAvatarEdit)}>
                  换头像
                </button>
                <button style={styles.changeAvatarBtn} onClick={() => setShowEditProfile(!showEditProfile)}>
                  编辑资料
                </button>
                <button style={styles.reportBtn} onClick={openReport}>
                  🎉 年度报告
                </button>
              </div>
            </div>
          </div>

          {/* 编辑资料面板 */}
          {showEditProfile && (
            <div style={styles.avatarEditBox}>
              <div style={styles.avatarEditLabel}>昵称</div>
              <input
                style={styles.editInput}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
              />
              <div style={{ ...styles.avatarEditLabel, marginTop: 10 }}>简介</div>
              <textarea
                style={styles.editTextarea}
                placeholder="介绍一下自己和你的娃..."
                maxLength={200}
                value={editIntro}
                onChange={(e) => setEditIntro(e.target.value)}
              />
              <div style={{ ...styles.avatarEditLabel, marginTop: 10 }}>主页背景图</div>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setBgFile(e.target.files?.[0] || null)}
              />
              <div style={styles.editActions}>
                <button style={styles.avatarUploadBtn} onClick={() => bgFileRef.current?.click()}>
                  {bgFile ? `已选：${bgFile.name}` : '🖼️ 上传背景图'}
                </button>
                <button style={styles.editSaveBtn} onClick={saveProfile}>保存</button>
                <button style={styles.editCancelBtn} onClick={() => { setShowEditProfile(false); setBgFile(null) }}>取消</button>
              </div>
            </div>
          )}

          {/* 关注/粉丝统计（可点击查看列表） */}
          <div style={styles.followStats}>
            <span style={styles.followStat} onClick={() => openList('following')}>
              关注 <b style={styles.followNum}>{followingCount}</b>
            </span>
            <span style={styles.followStat} onClick={() => openList('fans')}>
              粉丝 <b style={styles.followNum}>{fansCount}</b>
            </span>
          </div>

          {/* 换头像面板 */}
          {showAvatarEdit && (
            <div style={styles.avatarEditBox}>
              <div style={styles.avatarEditLabel}>选择默认头像：</div>
              <div style={styles.avatarEditGrid}>
                {defaultAvatars.map((e) => (
                  <span
                    key={e}
                    style={avatarEmoji === e ? styles.avatarEditItemSel : styles.avatarEditItem}
                    onClick={() => {
                      setAvatarEmoji(e)
                      saveEmojiAvatar(e)
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
              />
              <button style={styles.avatarUploadBtn} onClick={() => fileRef.current?.click()}>
                📷 上传照片
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ===== 年度报告弹窗 ===== */}
      {showReport && (
        <div style={styles.modalMask} onClick={() => setShowReport(false)}>
          <div style={styles.reportCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.reportTitle}>🎉 {report?.year || ''} 年度报告</div>
            {!report ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '30px 0' }}>加载中...</p>
            ) : (
              <div>
                <div style={styles.reportGrid}>
                <div style={styles.reportItem}>
                  <div style={styles.reportNum}>{report.yearDolls}</div>
                  <div style={styles.reportLabel}>今年入了 {report.yearDolls} 只娃</div>
                </div>
                <div style={styles.reportItem}>
                  <div style={styles.reportNum}>¥{report.yearTotal ?? 0}</div>
                  <div style={styles.reportLabel}>今年总花费</div>
                </div>
                <div style={styles.reportItem}>
                  <div style={{ ...styles.reportNum, fontSize: 18 }}>{report.mostExpensive || '—'}</div>
                  <div style={styles.reportLabel}>最贵的一只（¥{report.yearMaxPrice ?? 0}）</div>
                </div>
                <div style={styles.reportItem}>
                  <div style={styles.reportNum}>{report.yearDynamics}</div>
                  <div style={styles.reportLabel}>今年发了 {report.yearDynamics} 条动态</div>
                </div>
                <div style={styles.reportItem}>
                  <div style={styles.reportNum}>{report.yearLikes}</div>
                  <div style={styles.reportLabel}>今年收到 {report.yearLikes} 个赞</div>
                </div>
                <div style={styles.reportItem}>
                  <div style={styles.reportNum}>{report.fans}</div>
                  <div style={styles.reportLabel}>{report.fans} 位粉丝</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 15, color: '#999', marginTop: 12 }}>
                累计拥有 {report.totalDolls} 只娃，每一只都是心头好 🎀
              </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 内容分类 Tab（带数量） ===== */}
      <div style={styles.tabs}>
        {tabItem('dolls', '娃娃柜', myDolls.length)}
        {tabItem('dynamics', '动态', myDynamics.length)}
        {tabItem('comments', '评论', myComments.length)}
        {tabItem('likes', '赞过', myLikes.length)}
      </div>

      {/* ===== 关注/粉丝列表弹窗 ===== */}
      {listModal && (
        <div style={styles.modalMask} onClick={() => setListModal(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{listModal === 'following' ? '我的关注' : '我的粉丝'}</div>
            <div style={styles.modalBody}>
              {listData.length === 0 && <p style={styles.empty}>还没有哦～</p>}
              {listData.map((u) => (
                <div key={u.id} style={styles.modalRow}>
                  {u.avatar ? (
                    u.avatar.startsWith('/') || u.avatar.startsWith('http') ? (
                      <img src={u.avatar} alt="头像" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{u.avatar}</span>
                    )
                  ) : (
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{u.nickname?.charAt(0)}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>{u.nickname}</div>
                    <div style={{ fontSize: 16, color: '#999' }}>@{u.username}</div>
                  </div>
                  <button
                    style={u.following ? styles.modalFollowedBtn : styles.modalFollowBtn}
                    onClick={() => toggleFromList(u)}
                  >
                    {u.following ? '已关注' : '+ 关注'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 娃娃柜：双列瀑布流（主页重点） ===== */}
      {tab === 'dolls' && (
        <div style={styles.masonry}>
          {myDolls.length === 0 && <p style={styles.empty}>柜子还空着，快去添加娃娃吧～</p>}
          {myDolls.map((d) => (
            <div key={d.id} style={styles.masonryCard} onClick={() => setDetailId(d.id)}>
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.name} style={styles.masonryImg} />
              ) : (
                <div style={styles.masonryPlaceholder}>🐻</div>
              )}
              <div style={styles.masonryInfo}>
                <div style={styles.masonryName}>
                  {d.name}
                  {d.visible === 1 && <span style={{ fontSize: 11 }}>🔒</span>}
                </div>
                <div style={styles.masonryMeta}>
                  {d.type || '未分类'}
                  {d.price != null && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> · ¥{d.price}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== 动态 ===== */}
      {tab === 'dynamics' && (
        <div style={styles.listWrap}>
          {myDynamics.length === 0 && <p style={styles.empty}>还没有发布过动态</p>}
          {myDynamics.map((d) => (
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
            </div>
          ))}
        </div>
      )}

      {/* ===== 评论 ===== */}
      {tab === 'comments' && (
        <div style={styles.listWrap}>
          {myComments.length === 0 && <p style={styles.empty}>还没有评论过</p>}
          {myComments.map((c) => (
            <div key={c.id} style={styles.listCard}>
              <div style={{ color: '#999', fontSize: 14 }}>
                {c.createdAt?.replace('T', ' ').slice(0, 16)}
                {c.dynamicAuthorName ? ` · 评论了 @${c.dynamicAuthorName}` : ''}
              </div>
              <div style={{ marginTop: 6 }}>💬 {c.content}</div>
              {c.dynamicContent && (
                <div style={styles.listQuote}>原文：{c.dynamicContent}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== 赞过 ===== */}
      {tab === 'likes' && (
        <div style={styles.listWrap}>
          {myLikes.length === 0 && <p style={styles.empty}>还没有点赞过动态</p>}
          {myLikes.map((d) => (
            <div key={d.id} style={styles.listCard}>
              <div style={{ color: '#999', fontSize: 14 }}>
                {d.nickname} · {d.createdAt?.replace('T', ' ').slice(0, 16)} · ❤️ {d.likeCount}
              </div>
              <div style={{ marginTop: 6 }}>{d.content}</div>
            </div>
          ))}
        </div>
      )}

      <DollDetailModal dollId={detailId} onClose={() => setDetailId(null)} />
      <ImageViewer images={viewer?.urls ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page:{ minHeight:'100vh', background:'var(--bg)' },
  header:{ position:'relative', overflow:'hidden', background:'linear-gradient(145deg,var(--surface-soft) 0%,#f7e7ec 55%,#f1dfe5 100%)', paddingBottom:18, borderBottom:'1px solid #f0e4e7' },
  headerBg:{ position:'absolute', top:-55, right:-30, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.45)' },
  headerBgImg:{ position:'absolute', inset:0, backgroundSize:'cover', backgroundPosition:'center', opacity:.45 },
  intro:{ fontSize: 17, color:'var(--muted)', marginTop:6, maxWidth:470, lineHeight:'23px' },
  editInput:{ width:'100%', padding:'9px 10px', borderRadius:9, border:'1px solid var(--line)', background: 'var(--surface)', fontSize: 15, boxSizing:'border-box', outline:'none' },
  editTextarea:{ width:'100%', padding:'9px 10px', borderRadius:9, border:'1px solid var(--line)', background: 'var(--surface)', fontSize: 15, minHeight:60, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', outline:'none' },
  editActions:{ display:'flex', gap:8, marginTop:12, alignItems:'center', flexWrap:'wrap' },
  editSaveBtn:{ padding:'8px 18px', borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', fontSize: 15, fontWeight:700, cursor:'pointer' },
  editCancelBtn:{ padding:'8px 16px', borderRadius:9, border:'1px solid #e6dfe2', background: 'var(--surface)', color:'var(--muted)', fontSize: 15, cursor:'pointer' },
  reportCard:{ width:440, maxWidth:'90vw', background:'linear-gradient(150deg,#fff8fa,var(--accent-soft))', borderRadius:22, padding:'24px 20px', boxShadow:'0 20px 60px rgba(78,48,58,.16)', border:'1px solid #f1dfe4' },
  reportTitle:{ textAlign:'center', fontSize:18, fontWeight:700, color:'var(--accent-strong)', marginBottom:16 },
  reportGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  reportItem:{ background:'rgba(255,255,255,.88)', borderRadius:13, padding:'14px 8px', textAlign:'center', border:'1px solid #f3e7ea' },
  reportNum:{ fontSize:22, fontWeight:700, color:'var(--accent-strong)' },
  reportLabel:{ fontSize: 16, color:'var(--muted)', marginTop:6 },
  headerInner:{ position:'relative', width:'100%', maxWidth:'100%', margin:'0 auto', padding:'28px 28px 8px' },
  userRow:{ display:'flex', alignItems:'center', gap:16 },
  avatarWrap:{ display:'flex', alignItems:'center', gap:6 },
  btnRow:{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' },
  changeAvatarBtn:{ fontSize: 14, color:'var(--muted)', background:'rgba(255,255,255,.82)', border:'1px solid var(--line)', borderRadius:10, padding:'6px 13px', cursor:'pointer' },
  reportBtn:{ fontSize: 14, color:'#fff', background:'var(--accent)', border:'none', borderRadius:10, padding:'6px 13px', cursor:'pointer', boxShadow:'0 4px 12px rgba(31,31,35,.18)' },
  avatarEditBox:{ marginTop:15, background: 'var(--surface)', borderRadius:15, padding:'14px 16px', boxShadow:'0 7px 24px rgba(78,48,58,.08)', border:'1px solid var(--line)' },
  avatarEditLabel:{ fontSize: 15, color:'var(--accent-strong)', fontWeight:700, marginBottom:8 },
  avatarEditGrid:{ display:'flex', gap:8, flexWrap:'wrap' },
  avatarEditItem:{ width:38, height:38, borderRadius:'50%', background:'#fff6f8', border:'2px solid #f0dfe4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer' },
  avatarEditItemSel:{ width:38, height:38, borderRadius:'50%', background:'var(--accent-soft)', border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', boxShadow:'0 0 0 3px rgba(31,31,35,.1)' },
  avatarUploadBtn:{ marginTop:10, padding:'7px 13px', fontSize: 15, borderRadius:9, border:'1px dashed #e5aebd', background: 'var(--surface)', color:'var(--accent-strong)', cursor:'pointer' },
  avatar:{ width:88, height:88, borderRadius:'50%', background: 'var(--surface)', border:'4px solid rgba(255,255,255,.95)', boxShadow:'0 5px 16px rgba(78,48,58,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, color:'var(--accent-strong)', flexShrink:0 },
  nickname:{ fontSize:26, fontWeight:750, color:'var(--ink)' },
  accountId:{ fontSize: 16, color:'var(--muted)', marginTop:4 },
  followStats:{ display:'flex', gap:28, marginTop:17 },
  followStat:{ fontSize: 17, color:'var(--muted)', cursor:'pointer' },
  followNum:{ color:'var(--ink)', fontSize:17, marginLeft:4 },
  modalMask:{ position:'fixed', inset:0, zIndex:100, background:'rgba(48,42,44,.22)', display:'flex', alignItems:'center', justifyContent:'center' },
  modalCard:{ width:350, maxWidth:'90vw', maxHeight:'65vh', background: 'var(--surface)', borderRadius:18, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 18px 50px rgba(48,42,44,.16)' },
  modalTitle:{ padding:'15px 17px', fontWeight:700, fontSize:16, textAlign:'left', borderBottom:'1px solid var(--line)' },
  modalBody:{ overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:5 },
  modalRow:{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10 },
  modalFollowBtn:{ padding:'6px 13px', fontSize: 14, borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer' },
  modalFollowedBtn:{ padding:'6px 13px', fontSize: 14, borderRadius:9, border:'1px solid #e8e0e3', background:'var(--surface-soft)', color:'var(--muted)', cursor:'pointer' },
  tabs:{ position:'sticky', top:0, zIndex:50, display:'flex', justifyContent:'center', gap:4, padding:'11px 12px', background:'rgba(255,255,255,.96)', backdropFilter:'blur(10px)', borderBottom:'1px solid #eee6e8' },
  tab:{ padding:'8px 17px', borderRadius:10, fontSize: 17, cursor:'pointer', color:'var(--muted)', background:'transparent' },
  tabActive:{ padding:'8px 17px', borderRadius:10, fontSize: 17, fontWeight:700, cursor:'pointer', color:'var(--accent-strong)', background:'var(--accent-soft)' },
  tabCount:{ fontSize:11, marginLeft:3, opacity:.8 },
  masonry:{ width:'100%', maxWidth:'100%', margin:'0 auto', padding:'20px 28px 44px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:15 },
  masonryCard:{ background: 'var(--surface)', borderRadius:16, overflow:'hidden', border:'1px solid var(--line)', boxShadow:'0 7px 22px rgba(78,48,58,.05)', cursor:'pointer' },
  masonryImg:{ width:'100%', height:250, objectFit:'cover', display:'block' },
  masonryPlaceholder:{ width:'100%', height:250, background:'#fff2f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 },
  masonryInfo:{ padding:'10px 12px 12px' },
  masonryName:{ fontWeight:700, fontSize: 18, color:'var(--ink)' },
  masonryMeta:{ fontSize: 16, color:'var(--muted)', marginTop:4 },
  listWrap:{ width:'100%', maxWidth:'100%', margin:'0 auto', padding:'20px 28px 44px', display:'flex', flexDirection:'column', gap:10 },
  listCard:{ background: 'var(--surface)', borderRadius:15, padding:15, border:'1px solid var(--line)', boxShadow:'0 6px 20px rgba(78,48,58,.04)' },
  listQuote:{ marginTop:8, fontSize: 16, color:'var(--muted)', background:'var(--surface-soft)', padding:9, borderRadius:9 },
  listImages:{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' },
  listImg:{ width:120, height:120, objectFit:'cover', borderRadius:10 },
  empty:{ textAlign:'center', color:'var(--muted)', padding:'48px 0', gridColumn:'1 / -1' }
}

export default Profile
