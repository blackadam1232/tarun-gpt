import { useMemo, useState } from 'react'
import { MessageSquare, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import Logo from './Logo'

export default function Sidebar({
  conversations,
  activeId,
  loadingIds,
  open,
  onSelect,
  onNew,
  onDelete,
  onClose,
}) {
  const [filterQuery, setFilterQuery] = useState('')

  const filteredConversations = useMemo(() => {
    if (!filterQuery.trim()) return conversations
    const q = filterQuery.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, filterQuery])

  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-head">
          <div className="brand">
            <Logo size={32} />
            <div className="brand-text">
              <span className="brand-name">TARUN SIDDHARTHA</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <button className="new-chat-btn" onClick={onNew}>
          <div className="new-chat-icon">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span>Start New Chat</span>
          <span className="new-chat-shortcut">⌘N</span>
        </button>

        {/* Search Conversations Input */}
        {conversations.length > 2 && (
          <div className="sidebar-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              aria-label="Search conversation history"
            />
            {filterQuery && (
              <button
                className="search-clear"
                onClick={() => setFilterQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="sidebar-section-title">
          <span>Recent Conversations</span>
          <span className="convo-count">{conversations.length}</span>
        </div>

        <nav className="convo-list" aria-label="Conversations">
          {filteredConversations.length === 0 ? (
            <div className="convo-empty">No conversations found</div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId
              const isLoading = loadingIds.has(c.id)

              return (
                <div key={c.id} className={`convo ${isActive ? 'active' : ''}`}>
                  <button
                    className="convo-title"
                    onClick={() => onSelect(c.id)}
                    title={c.title}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <MessageSquare size={15} className="convo-icon" />
                    <span className="convo-text">{c.title}</span>
                    {isLoading && (
                      <span className="dot-pulse" role="status" aria-label="Generating response" />
                    )}
                  </button>
                  <button
                    className="convo-del"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(c.id)
                    }}
                    aria-label={`Delete ${c.title}`}
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
          )}
        </nav>

        {/* Footer info */}
        <div className="sidebar-footer">
          <div className="footer-status-pill">
            <span className="status-dot-live" />
            <span>Gemini Intelligence Active</span>
          </div>
          <p className="footer-copyright">Ramagiri Tarun Siddhartha · Neural Workspace</p>
        </div>
      </aside>
    </>
  )
}
