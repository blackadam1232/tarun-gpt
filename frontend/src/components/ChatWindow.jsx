import { useEffect, useRef } from 'react'
import { Eraser, Menu, Sparkles, Zap } from 'lucide-react'
import ChatInput from './ChatInput'
import Logo from './Logo'
import Message from './Message'
import WelcomeScreen from './WelcomeScreen'

const BADGE = {
  connecting: { tone: 'warn', label: 'Connecting…', hint: 'Connecting to backend...' },
  ready: { tone: 'ok', hint: 'Active Gemini Intelligence Model' },
  'no-key': {
    tone: 'warn',
    label: 'API Key Missing',
    hint: 'Configure GEMINI_API_KEY in backend/.env',
  },
  offline: {
    tone: 'bad',
    label: 'Backend Offline',
    hint: 'Start the FastAPI backend on port 8000',
  },
}

function ModelBadge({ backend }) {
  const badge = BADGE[backend.state]
  const label = backend.state === 'ready' ? backend.model : badge.label

  return (
    <div
      className={`model-chip ${badge.tone}`}
      title={backend.model ? `${badge.hint}: ${backend.model}` : badge.hint}
    >
      <span className="chip-indicator">
        <span className="chip-ping" />
        <span className="chip-core" />
      </span>
      <span className="chip-text">{label}</span>
    </div>
  )
}

export default function ChatWindow({
  conversation,
  loading,
  backend,
  onSend,
  onRetry,
  onClear,
  onOpenSidebar,
}) {
  const endRef = useRef(null)
  const { messages } = conversation

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation.id, messages.length, loading])

  return (
    <main className="main">
      {/* Ambient background mesh lighting */}
      <div className="ambient-glow-top" aria-hidden="true" />
      <div className="ambient-glow-bottom" aria-hidden="true" />

      {/* Glass Header */}
      <header className="chat-header">
        <div className="header-left">
          <button className="icon-btn menu-btn" onClick={onOpenSidebar} aria-label="Open sidebar">
            <Menu size={19} />
          </button>
          <div className="header-title-wrap">
            <h2 className="chat-title">{conversation.title}</h2>
          </div>
        </div>

        <div className="header-center">
          <ModelBadge backend={backend} />
        </div>

        <div className="header-right">
          <button
            className="icon-btn clear-btn"
            onClick={onClear}
            disabled={messages.length === 0 || loading}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Eraser size={17} />
          </button>
        </div>
      </header>

      {/* Chat scroll area */}
      <div className="scroll">
        {messages.length === 0 ? (
          <WelcomeScreen onPick={onSend} disabled={loading} />
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <Message
                key={message.id}
                message={message}
                canRetry={Boolean(message.error) && index === messages.length - 1 && !loading}
                onRetry={onRetry}
              />
            ))}

            {loading && (
              <div className="msg assistant loading-state" role="status" aria-label="Ramagiri Tarun Siddhartha GPT is generating">
                <div className="avatar-wrap">
                  <Logo size={30} className="avatar-bot pulse" />
                </div>
                <div className="bubble assistant-bubble typing-bubble">
                  <div className="typing-header">
                    <Sparkles size={13} className="text-violet" />
                    <span>Thinking with Gemini...</span>
                  </div>
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Floating composer */}
      <ChatInput onSend={onSend} disabled={loading} />
    </main>
  )
}
