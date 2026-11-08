import { Children, isValidElement, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertCircle, Check, Clock, Copy, RotateCcw, Volume2, VolumeX } from 'lucide-react'
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

function SpeakButton({ text }) {
  const [speaking, setSpeaking] = useState(false)

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    } else {
      window.speechSynthesis.cancel()
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted for reading.')
        .replace(/[#*_`>]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 1.05
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
    }
  }

  return (
    <button
      className={`chatgpt-copy-btn ${speaking ? 'speaking' : ''}`}
      onClick={toggleSpeak}
      title={speaking ? 'Stop speaking' : 'Read aloud'}
      aria-label={speaking ? 'Stop speaking' : 'Read aloud'}
    >
      {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
      <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
    </button>
  )
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
    <button className={`chatgpt-copy-btn ${copied ? 'copied' : ''}`} onClick={onClick} aria-label={label}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  )
}

function CodeBlock({ children }) {
  const code = Children.toArray(children).find(isValidElement)
  const language = /language-([\w-]+)/.exec(code?.props?.className || '')?.[1]
  const text = String(code?.props?.children ?? '').replace(/\n$/, '')

  return (
    <div className="chatgpt-code-block">
      <div className="code-block-header">
        <span className="code-language-tag">{language || 'code'}</span>
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
    <a {...props} target="_blank" rel="noopener noreferrer" className="chatgpt-link">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="table-responsive-wrapper">
      <table>{children}</table>
    </div>
  ),
}

export default function Message({ message, canRetry, onRetry }) {
  if (message.role === 'user') {
    return (
      <div className="msg-chatgpt user">
        <div className="user-bubble-box">
          <div className="user-text-content">{message.content}</div>
        </div>
      </div>
    )
  }

  if (message.error) {
    return (
      <div className="msg-chatgpt assistant error-row">
        <div className="msg-avatar-col">
          <div className="swirl-avatar-wrap error-avatar">
            <AlertCircle size={18} />
          </div>
        </div>
        <div className="msg-content-col">
          <div className="error-alert-card" role="alert">
            <p className="error-text-line">{message.content}</p>
            {canRetry && (
              <button className="chatgpt-retry-btn" onClick={onRetry}>
                <RotateCcw size={14} />
                <span>Retry Generation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="msg-chatgpt assistant">
      <div className="msg-avatar-col">
        <div className="swirl-avatar-wrap">
          <Logo size={22} className="avatar-swirl" />
        </div>
      </div>

      <div className="msg-content-col">
        <div className="chatgpt-markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>

        <div className="msg-bottom-actions">
          <CopyButton text={message.content} label="Copy response" />
          <SpeakButton text={message.content} />
          {message.elapsedMs != null && (
            <span className="elapsed-time-tag">
              <Clock size={11} />
              {(message.elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
