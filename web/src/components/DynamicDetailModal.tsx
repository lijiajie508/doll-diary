import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDynamic } from '../api/dynamic'
import { toggleLike } from '../api/favorite'
import { getComments, addComment, deleteComment } from '../api/comment'
import ImageViewer from './ImageViewer'
import ReportModal from './ReportModal'
import DollDetailModal from './DollDetailModal'

interface DynamicItem {
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
  dollId?: number
  dollName?: string
  dollImage?: string
  dollPrice?: number
  dollType?: string
}

interface CommentItem {
  id: number
  userId: number
  nickname: string
  content: string
  createdAt: string
}

interface Props {
  dynamic: DynamicItem
  myId: number | null
  onClose: () => void
  onDeleted?: (id: number) => void
  onUpdated?: (d: DynamicItem) => void
}

/**
 * 动态详情：点动态卡片进入，内容在上、评论区下滑可见（小红书/抖音式）
 */
function DynamicDetailModal({ dynamic, myId, onClose, onDeleted, onUpdated }: Props) {
  const navigate = useNavigate()
  const [dyn, setDyn] = useState<DynamicItem>(dynamic)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentText, setCommentText] = useState('')
  const [viewer, setViewer] = useState<{ urls: string[]; index: number } | null>(null)
  const [reportTarget, setReportTarget] = useState<{ type: 'dynamic' | 'comment' | 'user'; targetId: number } | null>(null)
  const [dollDetailId, setDollDetailId] = useState<number | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dyn.id])

  const loadComments = async () => {
    const res: any = await getComments(dyn.id)
    if (res.code === 200) {
      setComments(res.data)
      const next = { ...dyn, commentCount: res.data.length }
      setDyn(next)
      onUpdated?.(next)
    }
  }

  const handleLike = async () => {
    const res: any = await toggleLike(dyn.id)
    if (res.code === 200) {
      const next = { ...dyn, liked: res.data.liked, likeCount: res.data.likeCount }
      setDyn(next)
      onUpdated?.(next)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    await addComment({ dynamicId: dyn.id, content: commentText })
    setCommentText('')
    loadComments()
  }

  const handleDeleteComment = async (cid: number) => {
    await deleteComment(cid)
    loadComments()
  }

  const handleDeleteDynamic = async () => {
    if (!confirmDel) {
      setConfirmDel(true)
      return
    }
    setConfirmDel(false)
    await deleteDynamic(dyn.id)
    onDeleted?.(dyn.id)
    onClose()
  }

  const images = (dyn.images || '').split(',').filter(Boolean)

  const avatarEl = (av: string | undefined, nm: string, size: number) =>
    av ? (
      av.startsWith('/') || av.startsWith('http') ? (
        <img src={av} alt="头像" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size / 2 }}>{av}</span>
      )
    ) : (
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
        {nm.charAt(0)}
      </span>
    )

  return (
    <div style={styles.mask} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* 顶栏：作者信息 + 关闭 */}
        <div style={styles.head}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => {
              onClose()
              navigate(`/user/${dyn.userId}`)
            }}
          >
            {avatarEl(dyn.avatar, dyn.nickname, 40)}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{dyn.nickname}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{dyn.createdAt?.replace('T', ' ').slice(0, 16)}</div>
            </div>
          </div>
          <span style={styles.close} onClick={onClose}>✕</span>
        </div>

        {/* 滚动区：内容 + 评论区 */}
        <div style={styles.body}>
          {/* 动态内容 */}
          <div style={{ fontSize: 17, lineHeight: 1.75 }}>{dyn.content}</div>

          {/* 图片网格 */}
          {images.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  images.length === 1 ? 'minmax(0, 1fr)' : images.length === 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                marginTop: 14
              }}
            >
              {images.map((url, i) => (
                <img key={i} src={url} alt="娃娃" style={styles.img} onClick={() => setViewer({ urls: images, index: i })} />
              ))}
            </div>
          )}

          {/* 关联娃娃小卡片 */}
          {dyn.dollId && (
            <div style={styles.dollLink} onClick={() => setDollDetailId(dyn.dollId!)}>
              {dyn.dollImage ? (
                <img src={dyn.dollImage} alt={dyn.dollName || '娃娃'} style={styles.dollLinkImg} />
              ) : (
                <div style={styles.dollLinkImg}>🐻</div>
              )}
              <div style={styles.dollLinkInfo}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{dyn.dollName || '娃娃'}</div>
                <div style={{ fontSize: 14, color: '#888' }}>
                  {dyn.dollType || '未分类'}
                  {dyn.dollPrice != null && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> · ¥{dyn.dollPrice}</span>}
                </div>
              </div>
              <span style={styles.dollLinkGo}>查看详情 →</span>
            </div>
          )}

          {/* 操作栏 */}
          <div style={styles.actions}>
            <button onClick={handleLike} style={{ ...styles.actionBtn, color: dyn.liked ? 'var(--accent)' : '#666' }}>
              {dyn.liked ? '❤️' : '🤍'} {dyn.likeCount}
            </button>
            <button style={styles.actionBtn}>💬 {dyn.commentCount}</button>
            {myId === dyn.userId ? (
              <button
                onClick={handleDeleteDynamic}
                style={confirmDel ? styles.delBtnDanger : styles.delBtn}
              >
                {confirmDel ? '确认删除？' : '删除'}
              </button>
            ) : (
              <button style={styles.reportBtn} onClick={() => setReportTarget({ type: 'dynamic', targetId: dyn.id })}>
                举报
              </button>
            )}
          </div>

          {/* 评论区 */}
          <div style={styles.commentHead}>评论 {dyn.commentCount}</div>
          {comments.length === 0 && <div style={styles.empty}>还没有评论，来抢沙发～</div>}
          {comments.map((c) => (
            <div key={c.id} style={styles.commentItem}>
              <span
                style={{ fontWeight: 600, color: 'var(--accent-strong)', cursor: 'pointer' }}
                onClick={() => {
                  onClose()
                  navigate(`/user/${c.userId}`)
                }}
              >
                {c.nickname}
              </span>
              <span style={{ flex: 1 }}>{c.content}</span>
              {myId !== c.userId && (
                <button style={styles.delBtn} onClick={() => setReportTarget({ type: 'comment', targetId: c.id })}>举报</button>
              )}
              {myId === c.userId && (
                <button onClick={() => handleDeleteComment(c.id)} style={styles.delBtn}>删除</button>
              )}
            </div>
          ))}

          {/* 评论输入 */}
          <div style={styles.commentInputBar}>
            <input
              style={styles.commentInput}
              placeholder="说点什么..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
            />
            <button onClick={handleAddComment} style={styles.sendBtn}>发送</button>
          </div>
        </div>
      </div>

      <ImageViewer images={viewer?.urls ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
      <ReportModal
        open={!!reportTarget}
        type={reportTarget?.type ?? 'dynamic'}
        targetId={reportTarget?.targetId ?? 0}
        onClose={() => setReportTarget(null)}
      />
      <DollDetailModal dollId={dollDetailId} onClose={() => setDollDetailId(null)} />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  mask: {
    position: 'fixed', inset: 0, zIndex: 500,
    background: 'rgba(90,69,75,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24
  },
  card: {
    width: 760, maxWidth: '96vw', height: '92vh',
    background: 'var(--surface)', borderRadius: 20,
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 70px rgba(90,69,75,.25)', overflow: 'hidden'
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0
  },
  close: {
    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface-soft)', color: 'var(--muted)', fontSize: 14
  },
  body: { flex: 1, overflowY: 'auto', padding: '20px 22px 32px' },
  img: {
    width: '100%', aspectRatio: '1 / 1', objectFit: 'cover',
    borderRadius: 12, cursor: 'zoom-in', display: 'block'
  },
  dollLink: {
    display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: 12,
    borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface-soft)', cursor: 'pointer'
  },
  dollLinkImg: {
    width: 60, height: 60, borderRadius: 12, objectFit: 'cover',
    background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, flexShrink: 0
  },
  dollLinkInfo: { flex: 1, minWidth: 0 },
  dollLinkGo: { fontSize: 14, color: 'var(--accent-strong)', whiteSpace: 'nowrap', fontWeight: 600 },
  actions: {
    display: 'flex', gap: 8, marginTop: 18,
    borderTop: '1px solid var(--line)', paddingTop: 14
  },
  actionBtn: {
    padding: '8px 14px', borderRadius: 10, border: 'none',
    background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 15
  },
  delBtn: {
    padding: '6px 11px', borderRadius: 9, border: 'none',
    background: 'var(--surface-soft)', color: 'var(--muted)', cursor: 'pointer', fontSize: 13
  },
  delBtnDanger: {
    padding: '6px 12px', borderRadius: 9, border: '1px solid #f1b9c7',
    background: '#fff1f4', color: 'var(--accent-strong)', cursor: 'pointer', fontSize: 13, fontWeight: 600
  },
  reportBtn: {
    padding: '6px 11px', borderRadius: 9, border: 'none',
    background: 'transparent', cursor: 'pointer', color: 'var(--muted)', marginLeft: 'auto', fontSize: 13
  },
  commentHead: { fontSize: 16, fontWeight: 700, margin: '22px 0 12px' },
  empty: { color: 'var(--muted)', fontSize: 14, padding: '10px 0' },
  commentItem: {
    display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 15
  },
  commentInputBar: {
    display: 'flex', gap: 8, position: 'sticky', bottom: 0,
    background: 'var(--surface)', padding: '10px 0 2px', marginTop: 6
  },
  commentInput: {
    flex: 1, padding: '10px 13px', borderRadius: 12,
    border: '1px solid var(--line)', background: 'var(--surface-soft)',
    fontSize: 15, outline: 'none'
  },
  sendBtn: {
    padding: '10px 18px', borderRadius: 12, border: 'none',
    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
    fontSize: 15, fontWeight: 700
  }
}

export default DynamicDetailModal
