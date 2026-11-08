import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Download,
  Eraser,
  Menu,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import ChatInput from './ChatInput'
import Logo from './Logo'
import Message from './Message'
import WelcomeScreen from './WelcomeScreen'

const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', desc: 'Fast, high-capability, multimodal' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Balanced speed and intelligence' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Lightweight and highly responsive' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Deep reasoning and complex tasks' },
]

export default function ChatWindow({
  conversation,
  loading,
  backend,
  onSend,
  onStop,
  onRetry,
  onRegenerate,
  onClear,
  onOpenSidebar,
  selectedModel,
  onSelectModel,
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const endRef = useRef(null)
  const dropdownRef = useRef(null)
  const { messages } = conversation

  // Auto-scroll on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation.id, messages.length, loading])

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const currentModelName =
    AVAILABLE_MODELS.find((m) => m.id === (selectedModel || backend.model))?.name ||
    backend.model ||
    'Gemini 2.5 Flash'

  const exportChat = () => {
    if (!messages.length) return
    const title = conversation.title || 'Tarun-GPT-Chat'
    let md = `# ${title}\n*Exported from TARUN GPT on ${new Date().toLocaleString()}*\n\n---\n\n`
    for (const msg of messages) {
      const role = msg.role === 'user' ? '👤 **User**' : '✨ **Tarun GPT**'
      md += `### ${role}\n\n${msg.content}\n\n---\n\n`
    }
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/[^a-z0-9_-]+/gi, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="main-chatgpt">
      {/* Top Header */}
      <header className="chatgpt-header">
        <div className="header-left-bar">
          <button
            className="header-icon-btn menu-toggle-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <Menu size={20} />
          </button>
          {messages.length > 0 && (
            <h2 className="header-conversation-title">{conversation.title}</h2>
          )}
        </div>

        <div className="header-right-bar" ref={dropdownRef}>
          {/* Export conversation button if chat has messages */}
          {messages.length > 0 && (
            <button
              className="header-icon-btn export-chat-btn"
              onClick={exportChat}
              title="Export chat as Markdown (.md)"
              aria-label="Export chat as Markdown"
            >
              <Download size={17} />
            </button>
          )}

          {/* Clear conversation button if chat has messages */}
          {messages.length > 0 && (
            <button
              className="header-icon-btn clear-chat-btn"
              onClick={onClear}
              disabled={loading}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Eraser size={18} />
            </button>
          )}

          {/* Model Selector Pill (Exact look from the screenshot: Gemini 2.5 Flash ⌵) */}
          <div className="model-selector-wrapper">
            <button
              className="model-pill-selector"
              onClick={() => setModelDropdownOpen((prev) => !prev)}
              aria-label="Select AI model"
              aria-expanded={modelDropdownOpen}
            >
              <span className="model-pill-name">{currentModelName}</span>
              <ChevronDown size={15} className={`chevron-icon ${modelDropdownOpen ? 'open' : ''}`} />
            </button>

            {modelDropdownOpen && (
              <div className="model-dropdown-menu">
                <div className="dropdown-section-title">Model Selection</div>
                {AVAILABLE_MODELS.map((m) => {
                  const isSelected = (selectedModel || backend.model) === m.id
                  return (
                    <button
                      key={m.id}
                      className={`model-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onSelectModel(m.id)
                        setModelDropdownOpen(false)
                      }}
                    >
                      <div className="model-option-info">
                        <div className="model-option-name">{m.name}</div>
                        <div className="model-option-desc">{m.desc}</div>
                      </div>
                      {isSelected && <Check size={16} className="model-check-icon" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="chatgpt-scroll-area">
        {messages.length === 0 ? (
          <WelcomeScreen onPick={onSend} disabled={loading} />
        ) : (
          <div className="chatgpt-messages-container">
            {messages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                canRetry={Boolean(message.error) && index === messages.length - 1 && !loading}
                onRetry={onRetry}
                onRegenerate={() => onRegenerate(index)}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Floating Pill Composer */}
      <ChatInput onSend={onSend} disabled={loading} loading={loading} onStop={onStop} />
    </main>
  )
}
