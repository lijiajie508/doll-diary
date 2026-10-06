import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import request from '../api/request'
import { getFeed, publishDynamic, deleteDynamic } from '../api/dynamic'
import { toggleLike } from '../api/favorite'

import { getFollowing, toggleFollow } from '../api/follow'
import { compressImage } from '../utils/compress'
import ImageViewer from '../components/ImageViewer'
import ReportModal from '../components/ReportModal'
import DollDetailModal from '../components/DollDetailModal'
import DynamicDetailModal from '../components/DynamicDetailModal'

interface Dynamic {
  id: number
  userId: number
  nickname: string
  avatar?: string
  content: string
  images?: string
  createdAt: string
  likeCount: number
  commentCount: number
  liked: boolean
  // 关联娃娃（同步发布动态时带上）
  dollId?: number
  dollName?: string
  dollImage?: string
  dollPrice?: number
  dollType?: string
}



/**
 * 首页信息流：动态列表 + 发布（文字+图片）+ 点赞 + 评论
 */
function Home() {
  const navigate = useNavigate()
  const [feed, setFeed] = useState<Dynamic[]>([])
  const [content, setContent] = useState('')
  const [myId, setMyId] = useState<number | null>(null)
  // 动态详情弹窗（点卡片进入，评论区下滑查看）
  const [detailDyn, setDetailDyn] = useState<Dynamic | null>(null)
  // 我关注的人 ID 集合
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())

  // 图片上传相关（支持多张）
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 删除动态两段确认
  const [confirmDelDynId, setConfirmDelDynId] = useState<number | null>(null)
  // 分页加载
  const [feedPage, setFeedPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  // 查看大图
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null)
  // 举报弹窗
  const [reportTarget, setReportTarget] = useState<{ type: 'dynamic' | 'comment' | 'user'; targetId: number } | null>(null)
  // 娃娃详情弹窗（动态下挂的娃娃卡片点开）
  const [detailId, setDetailId] = useState<number | null>(null)

  // 未登录跳登录页；已登录拉取信息流
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    loadFeed()
    setMyId(Number(localStorage.getItem('userId') || 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFeed = async (page = 1, append = false) => {
    const res: any = await getFeed(page, 10)
    if (res.code === 200) {
      const list = res.data.list || []
      setFeed(append ? (prev) => [...prev, ...list] : list)
      setHasMore(list.length >= 10)
    }
    // 顺便加载我关注的人，用于动态卡片显示关注状态
    const fr: any = await getFollowing()
    if (fr.code === 200) {
      setFollowingIds(new Set(fr.data.map((u: { id: number }) => u.id)))
    }
  }

  // 滚动到底部加载下一页
  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    const next = feedPage + 1
    setFeedPage(next)
    await loadFeed(next, true)
    setLoadingMore(false)
  }

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300) {
        loadMore()
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedPage, hasMore, loadingMore])

  // 关注/取关动态作者
  const handleFollow = async (userId: number) => {
    const res: any = await toggleFollow(userId)
    if (res.code === 200) {
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (res.data.following) next.add(userId)
        else next.delete(userId)
        return next
      })
    }
  }

  // 选择图片后上传（支持多张，追加到列表，最多 9 张）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    // 最多 9 张：已选 + 新选 不能超过
    const remain = 9 - imageUrls.length
    if (remain <= 0) {
      alert('最多只能上传 9 张图片哦')
      return
    }
    const picked = files.slice(0, remain)
    if (picked.length < files.length) {
      alert(`最多 9 张，本次只上传前 ${remain} 张`)
    }
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of picked) {
        // 自动压缩后再上传，手机/相机大图不再吃服务器空间
        const compressed = await compressImage(file, 1600, 0.85)
        const formData = new FormData()
        formData.append('file', compressed)
        // 注意：不能手动写死 Content-Type，axios 会自动带上 boundary
        const res: any = await request.post('/upload', formData)
        if (res.code === 200) uploaded.push(res.data.url)
        else alert(res.message)
      }
      setImageUrls((prev) => [...prev, ...uploaded])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  const handlePublish = async () => {
    if (!content.trim() && imageUrls.length === 0) {
      alert('写点文字或选张图片再发布哦')
      return
    }
    await publishDynamic({ content, images: imageUrls.length ? imageUrls.join(',') : undefined })
    setContent('')
    setImageUrls([])
    loadFeed()
  }

  const handleLike = async (d: Dynamic) => {
    const res: any = await toggleLike(d.id)
    if (res.code === 200) {
      setFeed(feed.map((x) =>
        x.id === d.id ? { ...x, liked: res.data.liked, likeCount: res.data.likeCount } : x
      ))
    }
  }

  const handleDeleteDynamic = async (d: Dynamic) => {
    if (myId !== d.userId) {
      alert('只能删除自己的动态')
      return
    }
    // 两段确认，避免误删
    if (confirmDelDynId !== d.id) {
      setConfirmDelDynId(d.id)
      return
    }
    setConfirmDelDynId(null)
    await deleteDynamic(d.id)
    loadFeed()
  }

  return (
    <div>
      <Navbar />

      <div style={styles.page}>
        {/* AI 助手横幅：平台亮点，首页第一屏展示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #fdeef1, #f2c4d0)',
            cursor: 'pointer',
            marginBottom: 20,
            boxShadow: '0 6px 18px rgba(31,31,35,0.15)'
          }}
          onClick={() => navigate('/ai')}
        >
          <span
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 21
            }}
          >
            🤖
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 750, fontSize: 16, color: '#8a5466' }}>AI 助手 · 问问你的娃娃柜</div>
            <div style={{ fontSize: 15, color: 'rgba(138,84,102,0.8)', marginTop: 3 }}>
              今天加了什么娃娃？哪只最贵？都是哪买的？点我问问～
            </div>
          </div>
          <span style={{ color: '#8a5466', fontSize: 16, fontWeight: 700 }}>去问问 →</span>
        </div>

        {/* 发布框 */}
        <div style={styles.publishBox}>
          <div style={styles.publishIntro}>
            <span style={styles.publishEmoji}>✦</span>
            <div><div style={styles.publishTitle}>记录今天的小确幸</div><div style={styles.publishHint}>晒晒新娃、买娃日记，和同好分享一下吧</div></div>
          </div>
          <textarea
            style={styles.textarea}
            placeholder="晒晒你的娃娃吧..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div style={styles.publishSide}>
            {/* 隐藏的文件选择框，点图片按钮触发 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button title="添加图片" style={styles.imgBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? '上传中...' : '📷 图片'}
            </button>
            <button style={styles.publishBtn} onClick={handlePublish}>发布</button>
          </div>
        </div>

        {/* 已选图片预览（多张） */}
        {imageUrls.length > 0 && (
          <div style={styles.previewBox}>
            {imageUrls.map((url, i) => (
              <div key={url} style={{ position: 'relative' }}>
                <img src={url} alt="待发布" style={styles.previewImg} />
                <button
                  style={styles.removeImg}
                  onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            <span style={{ fontSize: 14, color: '#999' }}>已选 {imageUrls.length} 张</span>
          </div>
        )}

        {/* 动态列表 */}
        <div style={styles.feed} className="feed-grid">
          {feed.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>还没有动态，快来发布第一条吧～</p>}
          {feed.map((d) => (
            <div key={d.id} style={styles.card} onClick={() => setDetailDyn(d)}>
              <div style={styles.cardHead}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/user/${d.userId}`) }}
                >
                  {d.avatar ? (
                    d.avatar.startsWith('/') || d.avatar.startsWith('http') ? (
                      <img src={d.avatar} alt="头像" style={{ ...styles.avatar, objectFit: 'cover' }} />
                    ) : (
                      <span style={{ ...styles.avatar, fontSize: 20 }}>{d.avatar}</span>
                    )
                  ) : (
                    <div style={styles.avatar}>{d.nickname?.charAt(0) || '娃'}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{d.nickname}</div>
                    <div style={{ fontSize: 15, color: '#999' }}>{d.createdAt?.replace('T', ' ').slice(0, 16)}</div>
                  </div>
                </div>
                {myId === d.userId ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDynamic(d) }}
                    style={confirmDelDynId === d.id ? styles.delBtnDanger : styles.delBtn}
                  >
                    {confirmDelDynId === d.id ? '确认删除？' : '删除'}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollow(d.userId) }}
                    style={followingIds.has(d.userId) ? styles.followedBtn : styles.followBtn}
                  >
                    {followingIds.has(d.userId) ? '已关注' : '+ 关注'}
                  </button>
                )}
              </div>

              <div style={{ margin: '10px 0', fontSize: 16, lineHeight: 1.65 }}>{d.content}</div>
              {d.images && (
                <div style={{ ...styles.images, gridTemplateColumns: d.images.split(',').filter(Boolean).length === 1 ? 'minmax(0, 1fr)' : d.images.split(',').filter(Boolean).length === 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))' }}>
                  {d.images.split(',').filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="娃娃" style={styles.img} onClick={(e) => { e.stopPropagation(); setViewer({ urls: d.images!.split(',').filter(Boolean), index: i }) }} />
                  ))}
                </div>
              )}

              {/* 关联娃娃小卡片：点击进娃娃详情 */}
              {d.dollId && (
                <div style={styles.dollLink} onClick={(e) => { e.stopPropagation(); setDetailId(d.dollId!) }}>
                  {d.dollImage ? (
                    <img src={d.dollImage} alt={d.dollName || '娃娃'} style={styles.dollLinkImg} />
                  ) : (
                    <div style={styles.dollLinkImg}>🐻</div>
                  )}
                  <div style={styles.dollLinkInfo}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.dollName || '娃娃'}</div>
                    <div style={{ fontSize: 15, color: '#888' }}>
                      {d.dollType || '未分类'}
                      {d.dollPrice != null && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> · ¥{d.dollPrice}</span>}
                    </div>
                  </div>
                  <span style={styles.dollLinkGo}>查看详情 →</span>
                </div>
              )}

              <div style={styles.actions}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(d) }}
                  style={{ ...styles.actionBtn, color: d.liked ? 'var(--accent)' : '#666' }}
                >
                  {d.liked ? '❤️' : '🤍'} {d.likeCount}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDetailDyn(d) }} style={styles.actionBtn}>
                  💬 {d.commentCount}
                </button>
                {myId !== d.userId && (
                  <button style={styles.reportBtn} onClick={(e) => { e.stopPropagation(); setReportTarget({ type: 'dynamic', targetId: d.id }) }}>
                    举报
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* 加载更多提示 */}
        <div style={{ textAlign: 'center', color: '#999', fontSize: 15, padding: '16px 0 30px' }}>
          {loadingMore ? '加载中...' : hasMore ? '下拉加载更多 ↓' : '—— 到底啦 ——'}
        </div>
      </div>
      <ImageViewer images={viewer?.urls ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
      <DollDetailModal dollId={detailId} onClose={() => setDetailId(null)} />
      {detailDyn && (
        <DynamicDetailModal
          dynamic={detailDyn}
          myId={myId}
          onClose={() => setDetailDyn(null)}
          onDeleted={(id) => { setDetailDyn(null); setFeed(feed.filter((x) => x.id !== id)) }}
          onUpdated={(d) => setFeed(feed.map((x) => (x.id === d.id ? d : x)))}
        />
      )}
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
  page: { width:'100%', maxWidth:'100%', margin:'0 auto', padding:'30px 28px 56px' },
  publishBox: {
    background: 'var(--surface)', borderRadius:22, padding:'18px 20px 16px', marginBottom:22,
    boxShadow:'0 8px 28px rgba(78,48,58,.06)', border:'1px solid var(--line)'
  },
  publishIntro: { display:'flex', alignItems:'center', gap:11, marginBottom:12 },
  publishEmoji: { width:34, height:34, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--accent-soft)', color:'var(--accent)', fontSize:17 },
  publishTitle: { fontSize: 16, fontWeight:700, color:'var(--ink)' },
  publishHint: { fontSize: 14, color:'var(--muted)', marginTop:2 },
  publishSide: { display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end', marginTop:10 },
  textarea: { width:'100%', minHeight:76, padding:'12px 13px', borderRadius:14, border:'1px solid var(--line)', background:'var(--surface-soft)', fontSize: 16, resize:'vertical', color:'var(--ink)', outline:'none' },
  imgBtn: { padding:'9px 14px', borderRadius:11, border:'1px solid var(--line)', background: 'var(--surface)', color:'var(--accent-strong)', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' },
  publishBtn: { padding:'9px 18px', borderRadius:11, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 5px 12px rgba(236,156,179,.25)' },
  previewBox: { background: 'var(--surface)', borderRadius:16, padding:12, marginBottom:18, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', border:'1px solid var(--line)' },
  previewImg: { width:88, height:88, objectFit:'cover', borderRadius:11 },
  removeImg: { position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', border:'2px solid #fff', background:'var(--accent-strong)', color:'#fff', cursor:'pointer', fontSize:11, lineHeight:'18px', padding:0, textAlign:'center' },
  feed: { width:'100%', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, alignItems:'stretch' },
  card: { background: 'var(--surface)', borderRadius:18, padding:'18px 20px', border:'1px solid var(--line)', boxShadow:'0 10px 30px rgba(78,48,58,.055)', display:'flex', flexDirection:'column', height:'100%' },
  cardHead: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  avatar: { width:44, height:44, borderRadius:'50%', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--accent-strong)', border:'1px solid var(--line)' },
  delBtn: { padding:'5px 9px', borderRadius:8, border:'none', background:'var(--surface-soft)', color:'var(--muted)', cursor:'pointer', fontSize: 14 },
  delBtnDanger: { padding:'5px 10px', borderRadius:8, border:'1px solid #f1b9c7', background:'#fff1f4', color:'var(--accent-strong)', cursor:'pointer', fontSize: 14, fontWeight:600 },
  reportBtn: { padding:'5px 9px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'var(--muted)', marginLeft:'auto' },
  followBtn: { padding:'6px 13px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize: 14, fontWeight:700 },
  followedBtn: { padding:'5px 12px', borderRadius:10, border:'1px solid var(--line)', background:'var(--surface-soft)', color:'var(--muted)', cursor:'pointer', fontSize: 14 },
  images: { display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:7, marginTop:12 },
  img: { width:'100%', aspectRatio:'1 / 1', objectFit:'cover', borderRadius:12, cursor:'zoom-in', display:'block' },
  dollLink: { display:'flex', alignItems:'center', gap:12, marginTop:13, padding:10, borderRadius:13, border:'1px solid var(--line)', background:'var(--surface-soft)', cursor:'pointer' },
  dollLinkImg: { width:58, height:58, borderRadius:11, objectFit:'cover', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:25, flexShrink:0 },
  dollLinkInfo: { flex:1, minWidth:0 },
  dollLinkGo: { fontSize: 15, color:'var(--accent-strong)', whiteSpace:'nowrap', fontWeight:600 },
  actions: { display:'flex', gap:6, marginTop:'auto', paddingTop:12, borderTop:'1px solid #f4edef' },
  actionBtn: { padding:'7px 12px', borderRadius:9, border:'none', background:'transparent', cursor:'pointer', color:'var(--muted)', fontSize: 16 },
  commentBox: { marginTop:10, paddingTop:12, borderTop:'1px solid var(--line)', background:'var(--surface-soft)', borderRadius:12, padding:12 },
  commentItem: { marginBottom:8, fontSize: 16, display:'flex', gap:7, alignItems:'center' },
  commentInput: { flex:1, padding:'9px 11px', borderRadius:10, border:'1px solid var(--line)', background: 'var(--surface)', fontSize: 15, outline:'none' }
}

export default Home
