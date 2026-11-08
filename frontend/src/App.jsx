import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import Modals from './components/Modals'
import { getHealth, streamChat } from './services/api'
import { DEFAULT_PERSONA_ID, getPersonaPrompt } from './constants/personas'

const STORAGE_KEY = 'tarun-gpt:conversations:v1'
const PERSONA_KEY = 'tarun-gpt:persona'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
const newConversation = () => ({ id: uid(), title: 'New chat', messages: [] })

function titleFrom(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 36 ? `${clean.slice(0, 34).trimEnd()}…` : clean
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.conversations?.length) return saved
  } catch {
    /* start fresh */
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
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedPersona, setSelectedPersona] = useState(() => {
    return localStorage.getItem(PERSONA_KEY) || DEFAULT_PERSONA_ID
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const abortControllerRef = useRef(null)

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]
  const loading = loadingIds.has(active.id)

  // Keep conversations across page reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId: active.id }))
    } catch {
      /* ignore quota errors */
    }
  }, [conversations, active.id])

  // Fetch backend status and active model
  useEffect(() => {
    let cancelled = false
    getHealth()
      .then((h) => {
        if (!cancelled) {
          setBackend({ state: h.gemini_configured ? 'ready' : 'no-key', model: h.model })
          if (!selectedModel) setSelectedModel(h.model)
        }
      })
      .catch(() => !cancelled && setBackend({ state: 'offline', model: null }))
    return () => {
      cancelled = true
    }
  }, [])

  // Save selected persona
  const handleSelectPersona = (personaId) => {
    setSelectedPersona(personaId)
    localStorage.setItem(PERSONA_KEY, personaId)
  }

  const patch = useCallback(
    (id, update) => setConversations((prev) => prev.map((c) => (c.id === id ? update(c) : c))),
    [],
  )

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoadingIds((prev) => {
      const next = new Set(prev)
      next.delete(active.id)
      return next
    })
    patch(active.id, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    }))
  }

  const generate = useCallback(
    async (convId, history) => {
      setLoadingIds((prev) => new Set(prev).add(convId))
      const replyId = uid()
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Append assistant message that will stream live
      patch(convId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          { id: replyId, role: 'assistant', content: '', isStreaming: true },
        ],
      }))

      try {
        const systemPrompt = getPersonaPrompt(selectedPersona)
        await streamChat(history.filter((m) => !m.error), {
          model: selectedModel,
          systemPrompt,
          signal: controller.signal,
          onChunk: (chunkText) => {
            patch(convId, (c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === replyId ? { ...m, content: chunkText } : m,
              ),
            }))
          },
          onDone: (doneData) => {
            patch(convId, (c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === replyId
                  ? { ...m, isStreaming: false, elapsedMs: doneData.elapsed_ms }
                  : m,
              ),
            }))
            setBackend({ state: 'ready', model: doneData.model })
          },
        })

        // Ensure isStreaming is marked false
        patch(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === replyId ? { ...m, isStreaming: false } : m,
          ),
        }))
      } catch (err) {
        if (err.name === 'AbortError') return
        const content = err.message || 'Something went wrong. Please try again.'
        patch(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === replyId
              ? { ...m, content: m.content || content, error: !m.content, isStreaming: false }
              : m,
          ),
        }))
        if (err.status === 0) setBackend({ state: 'offline', model: null })
      } finally {
        abortControllerRef.current = null
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(convId)
          return next
        })
      }
    },
    [patch, selectedModel, selectedPersona],
  )

  const handleSend = (text) => {
    if (loading) return
    const history = [...active.messages, { id: uid(), role: 'user', content: text }]
    patch(active.id, (c) => ({
      ...c,
      title: c.messages.length ? c.title : titleFrom(text),
      messages: history,
    }))
    generate(active.id, history)
  }

  const handleRetry = () => {
    if (!active.messages.at(-1)?.error || loading) return
    const history = active.messages.slice(0, -1)
    patch(active.id, (c) => ({ ...c, messages: history }))
    generate(active.id, history)
  }

  const handleRegenerate = (msgIndex) => {
    if (loading) return
    // Slice history up to user question right before this assistant message
    const history = active.messages.slice(0, msgIndex)
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

  const handleRename = (id, newTitle) => {
    if (!newTitle?.trim()) return
    patch(id, (c) => ({ ...c, title: newTitle.trim() }))
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

  const handleClearAllChats = () => {
    const fresh = newConversation()
    setConversations([fresh])
    setActiveId(fresh.id)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="app-chatgpt-layout">
      <Sidebar
        conversations={conversations}
        activeId={active.id}
        loadingIds={loadingIds}
        open={sidebarOpen}
        onSelect={handleSelect}
        onNew={handleNew}
        onRename={handleRename}
        onDelete={handleDelete}
        onClose={() => setSidebarOpen(false)}
        onOpenModal={(type) => setActiveModal(type)}
      />

      <ChatWindow
        conversation={active}
        loading={loading}
        backend={backend}
        selectedModel={selectedModel}
        onSelectModel={(m) => setSelectedModel(m)}
        onSend={handleSend}
        onStop={handleStop}
        onRetry={handleRetry}
        onRegenerate={handleRegenerate}
        onClear={handleClear}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <Modals
        modalType={activeModal}
        onClose={() => setActiveModal(null)}
        onClearAllChats={handleClearAllChats}
        backend={backend}
        selectedPersona={selectedPersona}
        onSelectPersona={handleSelectPersona}
      />
    </div>
  )
}
