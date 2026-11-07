import { useEffect, useRef, useState } from 'react'
import { ArrowUp, CornerDownLeft, Sparkles, X } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const ref = useRef(null)

  // Grow textarea automatically with content up to max height
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [text])

  // Focus textarea when response completes (desktop)
  useEffect(() => {
    if (!disabled && window.matchMedia?.('(pointer: fine)').matches) {
      ref.current?.focus()
    }
  }, [disabled])

  const submit = () => {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer">
      <div className="composer-inner">
        <div className={`input-box ${text.trim() ? 'has-content' : ''}`}>
          <div className="input-field-wrap">
            <textarea
              ref={ref}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Ramagiri Tarun Siddhartha anything... (code, brainstorm, explain)"
              aria-label="Message Ramagiri Tarun Siddhartha"
            />
          </div>

          <div className="input-actions">
            {text.trim() && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => {
                  setText('')
                  if (ref.current) {
                    ref.current.style.height = 'auto'
                    ref.current.focus()
                  }
                }}
                title="Clear input"
                aria-label="Clear input text"
              >
                <X size={14} />
              </button>
            )}

            <button
              className="send-btn"
              onClick={submit}
              disabled={disabled || !text.trim()}
              aria-label="Send message"
              title={text.trim() ? 'Send message (Enter)' : 'Type a message to send'}
            >
              <ArrowUp size={17} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="composer-footer">
          <div className="footer-tips">
            <span className="kbd-badge">Enter ↵</span> to send
            <span className="footer-dot">·</span>
            <span className="kbd-badge">Shift + Enter</span> newline
          </div>
          <p className="footnote-disclaimer">
            Ramagiri Tarun Siddhartha GPT is powered by Google Gemini. Please verify critical information.
          </p>
        </div>
      </div>
    </div>
  )
}
