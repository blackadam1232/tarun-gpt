import { Children, isValidElement, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react'
import Logo from './Logo'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

function CopyButton({ text, label = 'Copy code' }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    if (await copyText(text)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={onClick} aria-label={label} title={label}>
      {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  )
}

function CodeBlock({ children }) {
  const code = Children.toArray(children).find(isValidElement)
  const language = /language-([\w-]+)/.exec(code?.props?.className || '')?.[1]
  const text = String(code?.props?.children ?? '').replace(/\n$/, '')

  return (
    <div className="code-block">
      <div className="code-head">
        <div className="code-mac-dots" aria-hidden="true">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="code-lang">{language || 'text'}</span>
        <CopyButton text={text} label="Copy code" />
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  )
}

const markdownComponents = {
  pre: CodeBlock,
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="md-link">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
}

export default function Message({ message, canRetry, onRetry }) {
  const [feedback, setFeedback] = useState(null) // 'liked' | 'disliked' | null

  if (message.role === 'user') {
    return (
      <div className="msg user">
        <div className="user-bubble-wrap">
          <div className="bubble user-bubble">{message.content}</div>
        </div>
      </div>
    )
  }

  if (message.error) {
    return (
      <div className="msg assistant error-msg">
        <div className="avatar-wrap">
          <span className="avatar avatar-error" aria-hidden="true">
            <AlertTriangle size={15} />
          </span>
        </div>
        <div className="bubble error-bubble" role="alert">
          <div className="error-header">
            <AlertTriangle size={16} />
            <strong>Generation Notice</strong>
          </div>
          <p>{message.content}</p>
          {canRetry && (
            <button className="retry-btn" onClick={onRetry}>
              <RotateCcw size={13} />
              <span>Retry Generation</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="msg assistant">
      <div className="avatar-wrap">
        <Logo size={30} className="avatar-bot" />
      </div>

      <div className="bubble assistant-bubble">
        <div className="markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>

        <div className="msg-meta">
          <div className="meta-left">
            <CopyButton text={message.content} label="Copy response" />
            {message.elapsedMs != null && (
              <span className="meta-pill" title="Inference time">
                <Clock size={11} />
                {(message.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <div className="meta-feedback">
            <button
              className={`feedback-btn ${feedback === 'liked' ? 'active' : ''}`}
              onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
              aria-label="Good response"
              title="Helpful response"
            >
              <ThumbsUp size={13} />
            </button>
            <button
              className={`feedback-btn ${feedback === 'disliked' ? 'active' : ''}`}
              onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
              aria-label="Poor response"
              title="Not helpful"
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
