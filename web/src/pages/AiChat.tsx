import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { askAi, aiHistory } from '../api/ai'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  '我今天添加了娃娃吗？',
  '我的柜子有哪些？',
  '我最贵的娃娃是哪只？',
  'Kitty 柜里有什么？'
]

/**
 * AI 助手聊天页：检索平台数据 + 豆包智能回答
 */
function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // 进入页面时加载历史聊天记录
  useEffect(() => {
    const load = async () => {
      const res: any = await aiHistory()
      if (res.code === 200 && Array.isArray(res.data)) {
        setMessages(
          [...res.data]
            .reverse()
            .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        )
      }
    }
    load()
  }, [])

  const send = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res: any = await askAi(q)
      const answer = res.code === 200 ? (res.data || '没找到答案～') : (res.message || 'AI 助手开小差了，稍后再试')
      setMessages([...next, { role: 'assistant', content: answer }])
    } catch {
      setMessages([...next, { role: 'assistant', content: '网络好像有点问题，稍后再试～' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.inner}>
        {/* 标题 */}
        <div style={styles.header}>
          <div style={styles.logo}>🤖</div>
          <div>
            <div style={styles.title}>AI 助手</div>
            <div style={styles.subtitle}>问问你的娃娃柜：今天加了什么、哪只最贵、渠道是哪买的</div>
          </div>
        </div>

        {/* 消息区 */}
        <div style={styles.chat}>
          {messages.length === 0 && (
            <div style={styles.empty}>
              <p>你好呀～我是娃柜日记 AI 助手 👋</p>
              <p style={{ fontSize: 15, color: '#999' }}>我能搜索平台数据回答你的问题，试试下面这些：</p>
              <div style={styles.suggestWrap}>
                {SUGGESTIONS.map((s) => (
                  <span key={s} style={styles.chip} onClick={() => send(s)}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? styles.rowUser : styles.rowAi}>
              <div style={m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.rowAi}>
              <div style={styles.bubbleAi}>思考中…</div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div style={styles.inputBar}>
          <input
            style={styles.input}
            placeholder="问点什么…（如：我今天添加了娃娃吗）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button style={styles.btn} onClick={() => send()} disabled={loading}>发送</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  inner: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 100px)'
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff9eb5, var(--accent))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    color: '#fff'
  },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 15, color: '#888', marginTop: 2 },
  chat: {
    flex: 1,
    overflowY: 'auto',
    background: 'var(--surface)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  empty: { textAlign: 'center', padding: '60px 0', color: '#666' },
  suggestWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  chip: {
    padding: '8px 14px',
    borderRadius: 16,
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    fontSize: 15,
    cursor: 'pointer',
    border: '1px solid var(--line)'
  },
  rowUser: { display: 'flex', justifyContent: 'flex-end' },
  rowAi: { display: 'flex', justifyContent: 'flex-start' },
  bubbleUser: {
    maxWidth: '80%',
    background: 'linear-gradient(135deg, var(--grad-1), var(--accent))',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '16px 16px 4px 16px',
    fontSize: 16,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  bubbleAi: {
    maxWidth: '80%',
    background: '#f5f5f5',
    color: '#333',
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    fontSize: 16,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  inputBar: { display: 'flex', gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 20,
    border: '1px solid #eee',
    background: 'var(--surface)',
    fontSize: 16,
    outline: 'none'
  },
  btn: {
    padding: '12px 22px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  }
}

export default AiChat
