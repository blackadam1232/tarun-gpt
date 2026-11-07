import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { getHealth, sendChat } from './services/api'

const STORAGE_KEY = 'tarun-gpt:conversations:v1'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const newConversation = () => ({ id: uid(), title: 'New chat', messages: [] })

// A conversation's title is the start of its first prompt.
function titleFrom(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 42 ? `${clean.slice(0, 40).trimEnd()}…` : clean
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.conversations?.length) return saved
  } catch {
    /* storage unavailable or corrupted: start fresh */
  }
  const first = newConversation()
  return { conversations: [first], activeId: first.id }
}

export default function App() {
  const [saved] = useState(loadSaved)
  const [conversations, setConversations] = useState(saved.conversations)
  const [activeId, setActiveId] = useState(saved.activeId)
  const [loadingIds, setLoadingIds] = useState(() => new Set())
  const [backend, setBackend] = useState({ state: 'connecting', model: null })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]
  const loading = loadingIds.has(active.id)

  // Keep conversations across page reloads.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId: active.id }))
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [conversations, active.id])

  // Ask the backend which model is active and whether the API key is configured.
  useEffect(() => {
    let cancelled = false
    getHealth()
      .then((h) => !cancelled && setBackend({ state: h.gemini_configured ? 'ready' : 'no-key', model: h.model }))
      .catch(() => !cancelled && setBackend({ state: 'offline', model: null }))
    return () => {
      cancelled = true
    }
  }, [])

  const patch = useCallback(
    (id, update) => setConversations((prev) => prev.map((c) => (c.id === id ? update(c) : c))),
    [],
  )

  // Sends `history` to Gemini (via the backend) and appends either the reply or an error message.
  const generate = useCallback(
    async (convId, history) => {
      setLoadingIds((prev) => new Set(prev).add(convId))
      try {
        const data = await sendChat(history.filter((m) => !m.error))
        const reply = { id: uid(), role: 'assistant', content: data.reply, elapsedMs: data.elapsed_ms }
        patch(convId, (c) => ({ ...c, messages: [...c.messages, reply] }))
        setBackend({ state: 'ready', model: data.model })
      } catch (err) {
        const content = err.message || 'Something went wrong. Please try again.'
        patch(convId, (c) => ({ ...c, messages: [...c.messages, { id: uid(), role: 'assistant', content, error: true }] }))
        if (err.status === 0) setBackend({ state: 'offline', model: null })
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(convId)
          return next
        })
      }
    },
    [patch],
  )

  const handleSend = (text) => {
    if (loading) return
    const history = [...active.messages, { id: uid(), role: 'user', content: text }]
    patch(active.id, (c) => ({ ...c, title: c.messages.length ? c.title : titleFrom(text), messages: history }))
    generate(active.id, history)
  }

  const handleRetry = () => {
    if (!active.messages.at(-1)?.error || loading) return
    const history = active.messages.slice(0, -1)
    patch(active.id, (c) => ({ ...c, messages: history }))
    generate(active.id, history)
  }

  const handleNew = () => {
    const blank = conversations.find((c) => c.messages.length === 0)
    if (blank) {
      setActiveId(blank.id)
    } else {
      const created = newConversation()
      setConversations((prev) => [created, ...prev])
      setActiveId(created.id)
    }
    setSidebarOpen(false)
  }

  const handleSelect = (id) => {
    setActiveId(id)
    setSidebarOpen(false)
  }

  const handleDelete = (id) => {
    const target = conversations.find((c) => c.id === id)
    if (target.messages.length && !window.confirm(`Delete "${target.title}"?`)) return
    const rest = conversations.filter((c) => c.id !== id)
    if (rest.length === 0) {
      const created = newConversation()
      setConversations([created])
      setActiveId(created.id)
      return
    }
    setConversations(rest)
    if (id === active.id) setActiveId(rest[0].id)
  }

  const handleClear = () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      patch(active.id, (c) => ({ ...c, title: 'New chat', messages: [] }))
    }
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={active.id}
        loadingIds={loadingIds}
        open={sidebarOpen}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatWindow
        conversation={active}
        loading={loading}
        backend={backend}
        onSend={handleSend}
        onRetry={handleRetry}
        onClear={handleClear}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  )
}
