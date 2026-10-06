import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { getDollDetail, type Doll } from '../api/doll'

interface DollDetailData {
  doll: Doll
  owner?: { id: number; username: string; nickname: string; avatar?: string } | null
  cabinetName?: string | null
}

/**
 * 娃娃详情弹窗：点击任意娃娃卡片弹出，看大图/信息/主人/柜子
 * 遮罩点击或关闭按钮关闭；不弹原生对话框
 */
function DollDetailModal({ dollId, onClose }: { dollId: number | null; onClose: () => void }) {
  const [data, setData] = useState<DollDetailData | null>(null)

  useEffect(() => {
    if (dollId == null) return
    setData(null)
    ;(async () => {
      const res: any = await getDollDetail(dollId)
      if (res.code === 200) setData(res.data)
    })()
  }, [dollId])

  if (dollId == null) return null

  const d = data?.doll

  return (
    <div style={styles.mask} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <span style={styles.closeBtn} onClick={onClose}>✕</span>
        {!d ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '50px 0' }}>加载中...</p>
        ) : (
          <div style={styles.body}>
            <div style={styles.imgWrap}>
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.name} style={styles.img} />
              ) : (
                <div style={styles.placeholder}>🐻</div>
              )}
            </div>
            <div style={styles.info}>
              <div style={styles.name}>
                {d.name}
                {d.visible === 1 && <span style={{ fontSize: 15 }}> 🔒</span>}
              </div>
              {data?.owner && (
                <div style={styles.ownerRow}>
                  {data.owner.avatar ? (
                    data.owner.avatar.startsWith('/') || data.owner.avatar.startsWith('http') ? (
                      <img src={data.owner.avatar} alt="头像" style={styles.ownerAvatar} />
                    ) : (
                      <span style={styles.ownerAvatarEmoji}>{data.owner.avatar}</span>
                    )
                  ) : (
                    <span style={styles.ownerAvatarText}>{data.owner.nickname?.charAt(0)}</span>
                  )}
                  <span style={styles.ownerName}>{data.owner.nickname}</span>
                </div>
              )}
              <div style={styles.metaRow}><span style={styles.metaLabel}>种类</span><span>{d.type || '未分类'}</span></div>
              <div style={styles.metaRow}><span style={styles.metaLabel}>价格</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{d.price != null ? `¥${d.price}` : '—'}</span></div>
              {d.buyChannel && <div style={styles.metaRow}><span style={styles.metaLabel}>购入渠道</span><span>{d.buyChannel}</span></div>}
              {data?.cabinetName && <div style={styles.metaRow}><span style={styles.metaLabel}>所在娃柜</span><span>{data.cabinetName}</span></div>}
              {d.createdAt && (
                <div style={styles.metaRow}><span style={styles.metaLabel}>添加时间</span><span>{d.createdAt.replace('T', ' ').slice(0, 16)}</span></div>
              )}
              {d.description && (
                <div style={styles.desc}>
                  <div style={{ ...styles.metaLabel, marginBottom: 4 }}>介绍</div>
                  {d.description}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  mask: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    position: 'relative',
    width: 640,
    maxWidth: '92vw',
    maxHeight: '86vh',
    overflowY: 'auto',
    background: 'var(--surface)',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 16px 60px rgba(0,0,0,0.3)'
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#f5f5f5',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    zIndex: 2
  },
  body: { display: 'flex', gap: 18, flexWrap: 'wrap' },
  imgWrap: { flex: '0 0 300px', maxWidth: '100%' },
  img: { width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 12, display: 'block' },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    background: 'var(--accent-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 64
  },
  info: { flex: 1, minWidth: 220 },
  name: { fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 10 },
  ownerRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  ownerAvatar: { width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' },
  ownerAvatarEmoji: {
    width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
  },
  ownerAvatarText: {
    width: 30, height: 30, borderRadius: '50%', background: 'var(--line)', color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
  },
  ownerName: { fontSize: 16, color: '#666', fontWeight: 600 },
  metaRow: { display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px dashed #f0f0f0', fontSize: 16, color: '#444' },
  metaLabel: { color: '#999', flexShrink: 0, width: 64 },
  desc: { marginTop: 12, fontSize: 16, color: '#666', lineHeight: '22px' }
}

export default DollDetailModal
