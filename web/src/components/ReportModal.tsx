import type { CSSProperties } from 'react'
import { useState } from 'react'
import { submitReport } from '../api/report'

interface ReportModalProps {
  open: boolean
  type: 'dynamic' | 'comment' | 'user'
  targetId: number
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  dynamic: '这条动态',
  comment: '这条评论',
  user: '这个用户'
}

/**
 * 举报弹窗：选择原因并提交，提交后提示等待管理员处理
 */
function ReportModal({ open, type, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  const submit = async () => {
    if (submitting || done) return
    setSubmitting(true)
    const res: any = await submitReport({ type, targetId, reason: reason.trim() || undefined })
    setSubmitting(false)
    if (res.code === 200) {
      setDone(true)
      setTimeout(onClose, 1200)
    } else {
      alert(res.message || '举报失败，请稍后再试')
    }
  }

  return (
    <div style={styles.mask} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>举报{TYPE_LABEL[type] || ''}</div>
        {done ? (
          <div style={styles.done}>已提交举报，管理员会尽快处理 🙏</div>
        ) : (
          <>
            <textarea
              style={styles.input}
              placeholder="说说举报原因（选填）"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div style={styles.actions}>
              <button style={styles.cancel} onClick={onClose}>取消</button>
              <button style={styles.submit} onClick={submit} disabled={submitting}>
                {submitting ? '提交中...' : '提交举报'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  mask: {
    position: 'fixed',
    inset: 0,
    zIndex: 250,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: 360,
    maxWidth: '90vw',
    background: 'var(--surface)',
    borderRadius: 16,
    padding: '20px 18px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
  },
  title: { fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 12, textAlign: 'center' },
  input: {
    width: '100%',
    minHeight: 80,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #eee',
    fontSize: 16,
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none'
  },
  actions: { display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' },
  cancel: {
    padding: '8px 18px',
    borderRadius: 10,
    border: '1px solid #ddd',
    background: 'var(--surface)',
    color: '#888',
    fontSize: 16,
    cursor: 'pointer'
  },
  submit: {
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  done: { textAlign: 'center', color: 'var(--accent)', fontSize: 16, padding: '24px 0' }
}

export default ReportModal
