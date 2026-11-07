import { AlignLeft, BookOpen, Code, Sparkles } from 'lucide-react'
import Logo from './Logo'

const SUGGESTIONS = [
  {
    icon: Code,
    label: 'Write a Python program',
    prompt: 'Write a Python program that demonstrates a clean REST API client with robust error handling and retries.',
  },
  {
    icon: BookOpen,
    label: 'Explain a concept simply',
    prompt: 'Explain how attention mechanisms in transformers work using a simple everyday analogy.',
  },
  {
    icon: AlignLeft,
    label: 'Create a study plan',
    prompt: 'Create a focused 7-day study plan to prepare for technical interviews covering algorithms and system design.',
  },
  {
    icon: Sparkles,
    label: 'Give me a project idea',
    prompt: 'Give me three creative and practical project ideas combining React, FastAPI, and the Google Gemini API.',
  },
]

export default function WelcomeScreen({ onPick, disabled }) {
  return (
    <section className="welcome-chatgpt">
      <div className="welcome-hero">
        <Logo size={62} className="hero-swirl" />
        <h1 className="hero-title">Welcome to TARUN GPT</h1>
        <p className="hero-subtitle">
          Your AI assistant for learning, coding, research, and more.
        </p>
      </div>

      <div className="suggestions-grid">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              className="suggestion-pill-card"
              onClick={() => onPick(item.prompt)}
              disabled={disabled}
            >
              <div className="suggestion-icon-wrap">
                <Icon size={18} strokeWidth={2} />
              </div>
              <span className="suggestion-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
