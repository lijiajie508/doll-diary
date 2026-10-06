import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getConversations, getThread, sendMessage, markMessageRead, type Conversation, type ChatMessage } from '../api/message'

/**
 * 私信页：左侧会话列表 + 右侧聊天窗口
 * 打开会话自动标记已读；每 3 秒轮询新消息
 */
function Messages() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [myId] = useState<number>(Number(localStorage.getItem('userId') || 0))
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = async () => {
    const res: any = await getConversations()
    if (res.code === 200) setConversations(res.data)
  }

  const loadThread = async (otherId: number) => {
    const res: any = await getThread(otherId)
    if (res.code === 200) {
      setThread(res.data)
      // 打开会话即标记已读并刷新会话列表
      await markMessageRead(otherId)
      loadConversations()
    }
  }

  useEffect(() => {
    loadConversations()
    // 从他人主页跳来（?otherId=）时自动打开对应会话
    const otherParam = searchParams.get('otherId')
    if (otherParam) {
      const oid = Number(otherParam)
      setActiveId(oid)
      loadThread(oid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 打开会话
  const openConversation = (otherId: number) => {
    setActiveId(otherId)
    loadThread(otherId)
  }

  // 轮询：有活跃会话时每 3 秒拉一次新消息 + 刷新会话列表
  useEffect(() => {
    if (activeId === null) return
    const t = setInterval(() => {
      loadThread(activeId)
    }, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // 新消息自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activeId])

  const handleSend = async () => {
    if (!text.trim() || activeId === null) return
    await sendMessage(activeId, text.trim())
    setText('')
    loadThread(activeId)
  }

  const activeConv = conversations.find((c) => c.otherId === activeId)

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
        {/* 左侧会话列表 */}
        <div style={styles.sidebar}>
          <div style={styles.sideTitle}>私信</div>
          {conversations.length === 0 && <p style={styles.empty}>还没有私信～<br />去别人的主页点「私信」聊聊吧</p>}
          {conversations.map((c) => (
            <div
              key={c.otherId}
              style={activeId === c.otherId ? styles.convActive : styles.conv}
              onClick={() => openConversation(c.otherId)}
            >
              {avatarOf(c.avatar, c.nickname, 42)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{c.nickname}</span>
                  <span style={{ fontSize: 11, color: '#bbb' }}>{c.lastTime?.replace('T', ' ').slice(5, 16)}</span>
                </div>
                <div style={{ fontSize: 15, color: '#999', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessage}
                </div>
              </div>
              {c.unread > 0 && <span style={styles.badge}>{c.unread}</span>}
            </div>
          ))}
        </div>

        {/* 右侧聊天窗口 */}
        <div style={styles.chatBox}>
          {activeId === null ? (
            <div style={styles.chatEmpty}>选择一个会话开始聊天～</div>
          ) : (
            <>
              <div style={styles.chatHead}>
                <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${activeId}`)}>
                  {activeConv?.nickname || '用户'}
                </span>
              </div>
              <div style={styles.thread}>
                {thread.map((m) => {
                  const mine = m.senderId === myId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={mine ? styles.bubbleMine : styles.bubbleOther}>
                        <div style={{ fontSize: 16, wordBreak: 'break-word' }}>{m.content}</div>
                        <div style={{ fontSize: 10, color: mine ? 'rgba(255,255,255,0.8)' : '#bbb', marginTop: 3, textAlign: 'right' }}>
                          {m.createdAt?.replace('T', ' ').slice(5, 16)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div style={styles.inputRow}>
                <input
                  style={styles.input}
                  placeholder="说点什么..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button style={styles.sendBtn} onClick={handleSend}>发送</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  inner: {
    width: '100%', maxWidth: '100%',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    gap: 16,
    alignItems: 'stretch',
    height: 'calc(100vh - 90px)'
  },
  sidebar: {
    flex: '0 0 300px',
    background: 'var(--surface)',
    borderRadius: 14,
    overflowY: 'auto',
    padding: '10px 8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  sideTitle: { fontSize: 17, fontWeight: 700, padding: '8px 12px 12px' },
  conv: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    position: 'relative'
  },
  convActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    background: 'var(--accent-soft)',
    position: 'relative'
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    background: '#ff3b5c',
    color: '#fff',
    fontSize: 11,
    lineHeight: '18px',
    textAlign: 'center',
    padding: '0 5px',
    boxSizing: 'border-box'
  },
  chatBox: {
    flex: 1,
    background: 'var(--surface)',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  chatEmpty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' },
  chatHead: {
    padding: '14px 18px',
    fontWeight: 700,
    borderBottom: '1px solid #f0f0f0'
  },
  thread: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'var(--surface-soft)'
  },
  bubbleMine: {
    maxWidth: '72%',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: '14px 14px 4px 14px',
    padding: '9px 13px'
  },
  bubbleOther: {
    maxWidth: '72%',
    background: 'var(--surface)',
    color: '#333',
    borderRadius: '14px 14px 14px 4px',
    padding: '9px 13px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  inputRow: { display: 'flex', gap: 10, padding: '12px 14px', borderTop: '1px solid #f0f0f0' },
  input: {
    flex: 1,
    padding: '11px 14px',
    borderRadius: 20,
    border: '1px solid #eee',
    background: 'var(--bg)',
    fontSize: 16,
    outline: 'none'
  },
  sendBtn: {
    padding: '11px 22px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  empty: { textAlign: 'center', color: '#999', padding: '30px 12px', fontSize: 15, lineHeight: '22px' }
}

export default Messages
