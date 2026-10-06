import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

interface ImageViewerProps {
  images: string[] | null
  index: number
  onClose: () => void
}

/**
 * 图片查看大图弹窗：支持多图左右切换（‹ ›）、计数显示、Esc 关闭、点击遮罩关闭
 */
function ImageViewer({ images, index, onClose }: ImageViewerProps) {
  const [cur, setCur] = useState(index)

  useEffect(() => setCur(index), [index])
  useEffect(() => {
    if (!images || images.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCur((c) => (c - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setCur((c) => (c + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images, onClose])

  if (!images || images.length === 0) return null
  const url = images[cur] ?? images[0]
  const multi = images.length > 1

  return (
    <div style={styles.mask} onClick={onClose}>
      <span style={styles.closeBtn} onClick={onClose}>✕</span>
      {multi && (
        <>
          <button
            style={styles.nav}
            onClick={(e) => { e.stopPropagation(); setCur((cur - 1 + images.length) % images.length) }}
          >
            ‹
          </button>
          <button
            style={{ ...styles.nav, right: 18, left: 'auto' }}
            onClick={(e) => { e.stopPropagation(); setCur((cur + 1) % images.length) }}
          >
            ›
          </button>
          <span style={styles.counter}>{cur + 1} / {images.length}</span>
        </>
      )}
      <img src={url} alt="查看大图" style={styles.img} onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  mask: {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'zoom-out'
  },
  img: {
    maxWidth: '92vw',
    maxHeight: '92vh',
    objectFit: 'contain',
    borderRadius: 8,
    cursor: 'default'
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 22,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
    zIndex: 2
  },
  nav: {
    position: 'absolute',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 28,
    lineHeight: '44px',
    padding: 0,
    cursor: 'pointer',
    zIndex: 2
  },
  counter: {
    position: 'absolute',
    bottom: 22,
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: 16,
    background: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: '4px 14px',
    zIndex: 2
  }
}

export default ImageViewer
