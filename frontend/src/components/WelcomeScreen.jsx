import { ArrowUpRight, Code2, Compass, Lightbulb, Sparkles } from 'lucide-react'
import Logo from './Logo'

const SUGGESTIONS = [
  {
    icon: Code2,
    category: 'Development',
    label: 'FastAPI & React Architecture',
    prompt: 'Write a clean FastAPI endpoint with Pydantic v2 validation and rate limiting.',
  },
  {
    icon: Sparkles,
    category: 'Concept & Learning',
    label: 'Deep Learning Analogy',
    prompt: 'Explain how neural network attention mechanisms work using an intuitive real-world analogy.',
  },
  {
    icon: Lightbulb,
    category: 'Ideation',
    label: 'Full-Stack Project Ideas',
    prompt: 'Give me five innovative AI SaaS project ideas combining React, FastAPI, and Gemini API.',
  },
  {
    icon: Compass,
    category: 'Productivity',
    label: 'Sprint Study Schedule',
    prompt: 'Help me plan a focused 3-day revision sprint for algorithms and system design exams.',
  },
]

export default function WelcomeScreen({ onPick, disabled }) {
  return (
    <section className="welcome">
      <div className="welcome-glow-orb" aria-hidden="true" />

      <div className="welcome-pill">
        <span className="welcome-pill-sparkle">✨</span>
        <span>Powered by Google Gemini</span>
      </div>

      <div className="welcome-brand">
        <div className="welcome-logo-wrap">
          <Logo size={64} className="welcome-hero-logo" />
        </div>
        <h1 className="welcome-title">
          What will you create <span className="text-gradient">today?</span>
        </h1>
        <p className="tagline">
          Experience next-generation reasoning, code generation, and deep insights with Ramagiri Tarun Siddhartha GPT.
        </p>
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              className="suggestion-card"
              onClick={() => onPick(item.prompt)}
              disabled={disabled}
            >
              <div className="card-top">
                <div className="card-icon-wrap">
                  <Icon size={16} />
                </div>
                <span className="card-category">{item.category}</span>
                <ArrowUpRight size={15} className="card-arrow" />
              </div>
              <div className="card-body">
                <strong className="card-label">{item.label}</strong>
                <p className="card-prompt">{item.prompt}</p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
