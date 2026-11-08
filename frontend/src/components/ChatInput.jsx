import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Code2, FileCode, FileText, Mic, MicOff, Paperclip, Plus, Sparkles, Upload, X } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const ref = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize Speech Recognition if supported by the browser
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Auto-grow textarea height
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  // Focus textarea when done
  useEffect(() => {
    if (!disabled && window.matchMedia?.('(pointer: fine)').matches) {
      ref.current?.focus()
    }
  }, [disabled])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to reasonable text file size (e.g. 1MB)
    if (file.size > 1024 * 1024) {
      alert('Please upload files smaller than 1MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        const sizeKb = (file.size / 1024).toFixed(1)
        setAttachedFile({
          name: file.name,
          size: `${sizeKb} KB`,
          content,
        })
        setShowAttachMenu(false)
      }
    }
    reader.readAsText(file)
    // Reset file input so user can pick the same file again if desired
    e.target.value = ''
  }

  const removeAttachedFile = () => {
    setAttachedFile(null)
  }

  const submit = () => {
    const value = text.trim()
    if ((!value && !attachedFile) || disabled) return

    let finalMessage = value
    if (attachedFile) {
      const ext = attachedFile.name.split('.').pop() || ''
      const fileHeader = `[Attached File: ${attachedFile.name}]\n\`\`\`${ext}\n${attachedFile.content}\n\`\`\`\n\n`
      finalMessage = fileHeader + (value || 'Please review or explain this file.')
    }

    onSend(finalMessage)
    setText('')
    setAttachedFile(null)
    setShowAttachMenu(false)
    if (ref.current) ref.current.style.height = 'auto'
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const handleTemplate = (prompt) => {
    setText(prompt)
    setShowAttachMenu(false)
    ref.current?.focus()
  }

  const hasContent = text.trim() || attachedFile

  return (
    <div className="chatgpt-composer-dock">
      <div className="composer-container">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".txt,.py,.js,.jsx,.ts,.tsx,.json,.csv,.md,.html,.css,.sql,.java,.c,.cpp,.h,.sh,.yml,.yaml,.xml"
          onChange={handleFileSelect}
        />

        {/* Plus Attach Popup Menu */}
        {showAttachMenu && (
          <div className="attach-popup-menu">
            <button
              className="attach-item-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>Upload File or Code</span>
            </button>
            <button
              className="attach-item-btn"
              onClick={() => handleTemplate('Debug this code snippet:\n```\n\n```')}
            >
              <Code2 size={16} />
              <span>Insert Code Template</span>
            </button>
            <button
              className="attach-item-btn"
              onClick={() => handleTemplate('Summarize the following document into key bullet points:\n\n')}
            >
              <FileText size={16} />
              <span>Summarize Document</span>
            </button>
            <button
              className="attach-item-btn"
              onClick={() => handleTemplate('Explain this concept step-by-step for a beginner: ')}
            >
              <Sparkles size={16} />
              <span>Step-by-step explanation</span>
            </button>
          </div>
        )}

        {/* Floating Pill Input Bar */}
        <div className={`chatgpt-input-pill ${hasContent ? 'has-input' : ''}`}>
          {/* Plus Button */}
          <button
            type="button"
            className={`input-circle-btn plus-btn ${showAttachMenu ? 'active' : ''}`}
            onClick={() => setShowAttachMenu((prev) => !prev)}
            aria-label="Add attachment or prompt template"
            title="Add template or file attachment"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>

          <div className="pill-input-middle">
            {attachedFile && (
              <div className="attached-file-badge">
                <FileCode size={14} className="attached-file-icon" />
                <span className="attached-file-name" title={attachedFile.name}>
                  {attachedFile.name}
                </span>
                <span className="attached-file-size">({attachedFile.size})</span>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={removeAttachedFile}
                  title="Remove file"
                  aria-label="Remove attached file"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Text Area */}
            <textarea
              ref={ref}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                isListening
                  ? 'Listening... Speak now.'
                  : attachedFile
                  ? 'Ask anything about this file...'
                  : 'Ask anything...'
              }
              aria-label="Ask anything..."
            />
          </div>

          {/* Right Action Buttons */}
          <div className="pill-actions-right">
            {/* Microphone Button */}
            <button
              type="button"
              className={`input-circle-btn mic-btn ${isListening ? 'recording' : ''}`}
              onClick={toggleMic}
              aria-label={isListening ? 'Stop recording' : 'Voice input'}
              title={isListening ? 'Listening...' : 'Voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              className="input-circle-btn send-circle-btn"
              onClick={submit}
              disabled={disabled || !hasContent}
              aria-label="Send message"
              title="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className="chatgpt-footer-disclaimer">
          TARUN GPT is powered by Google Gemini.
        </p>
      </div>
    </div>
  )
}
