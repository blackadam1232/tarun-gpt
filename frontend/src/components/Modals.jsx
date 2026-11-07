import { AlertTriangle, Check, ExternalLink, HelpCircle, Info, Key, Settings, Trash2, X } from 'lucide-react'

export default function Modals({ modalType, onClose, onClearAllChats, backend }) {
  if (!modalType) return null

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div className="modal-title-wrap">
            {modalType === 'settings' && <Settings size={20} />}
            {modalType === 'help' && <HelpCircle size={20} />}
            {modalType === 'about' && <Info size={20} />}
            <h3>
              {modalType === 'settings' && 'Settings'}
              {modalType === 'help' && 'Help & FAQ'}
              {modalType === 'about' && 'About TARUN GPT'}
            </h3>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-dialog-body">
          {modalType === 'settings' && (
            <div className="modal-section-stack">
              <div className="setting-option-row">
                <div className="setting-info">
                  <strong className="setting-label">Active Gemini Model</strong>
                  <span className="setting-subtext">Currently loaded model on backend</span>
                </div>
                <span className="model-status-pill ok">
                  {backend.model || 'gemini-3.6-flash'}
                </span>
              </div>

              <div className="setting-option-row">
                <div className="setting-info">
                  <strong className="setting-label">Backend Connection</strong>
                  <span className="setting-subtext">FastAPI service status</span>
                </div>
                <span className={`model-status-pill ${backend.state === 'ready' ? 'ok' : 'warn'}`}>
                  {backend.state === 'ready' ? 'Connected' : backend.state}
                </span>
              </div>

              <div className="setting-option-row danger-zone">
                <div className="setting-info">
                  <strong className="setting-label text-danger">Clear All Conversations</strong>
                  <span className="setting-subtext">Erase all saved chat history from local storage</span>
                </div>
                <button
                  className="danger-action-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all conversations?')) {
                      onClearAllChats()
                      onClose()
                    }
                  }}
                >
                  <Trash2 size={15} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          )}

          {modalType === 'help' && (
            <div className="modal-section-stack">
              <div className="help-block">
                <h4>Keyboard Shortcuts</h4>
                <div className="shortcut-list">
                  <div className="shortcut-row">
                    <span>Send message</span>
                    <kbd>Enter ↵</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>New line in prompt</span>
                    <kbd>Shift + Enter</kbd>
                  </div>
                  <div className="shortcut-row">
                    <span>Voice Input</span>
                    <span>Click the 🎙️ icon in input</span>
                  </div>
                </div>
              </div>

              <div className="help-block">
                <h4>Pro Tips</h4>
                <ul className="help-bullets">
                  <li>Ask for code in Python, JavaScript, SQL, or any language with full formatting.</li>
                  <li>Use the <strong>+</strong> button in the input bar to quickly insert code templates.</li>
                  <li>Click on any suggestion card on the home screen to test prompts instantly.</li>
                </ul>
              </div>
            </div>
          )}

          {modalType === 'about' && (
            <div className="modal-section-stack">
              <div className="about-hero">
                <strong className="about-brand">TARUN GPT</strong>
                <p className="about-tagline">
                  Your AI assistant for learning, coding, research, and more.
                </p>
              </div>

              <div className="about-meta-grid">
                <div className="about-item">
                  <span className="about-label">AI Engine</span>
                  <span className="about-val">Google Gemini API (`google-genai`)</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Backend</span>
                  <span className="about-val">FastAPI (Python 3.10+)</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Frontend</span>
                  <span className="about-val">React 18 + Vite (Tailored Dark Theme)</span>
                </div>
                <div className="about-item">
                  <span className="about-label">Storage</span>
                  <span className="about-val">Encrypted Browser LocalStorage</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-dialog-footer">
          <button className="modal-primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
