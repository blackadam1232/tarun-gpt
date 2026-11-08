import { useState } from 'react'
import {
  Check,
  HelpCircle,
  Info,
  Menu,
  MessageSquare,
  Pencil,
  Search,
  Settings,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import Logo from './Logo'

export default function Sidebar({
  conversations,
  activeId,
  loadingIds,
  open,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onClose,
  onOpenModal,
}) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase().trim()),
  )

  const startRename = (c, e) => {
    e.stopPropagation()
    setEditingId(c.id)
    setEditTitle(c.title)
  }

  const saveRename = (id) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleKeyDownRename = (e, id) => {
    if (e.key === 'Enter') {
      saveRename(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar-chatgpt ${open ? 'open' : ''}`}>
        {/* Top Header */}
        <div className="sidebar-header">
          <div className="brand-wrap">
            <Logo size={24} className="brand-logo" />
            <span className="brand-title">TARUN GPT</span>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={onClose}
            aria-label="Toggle sidebar"
            title="Collapse sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <button className="new-chat-pill-btn" onClick={onNew}>
          <SquarePen size={16} strokeWidth={2} />
          <span>New Chat</span>
        </button>

        {/* Search Chat Bar */}
        {conversations.length > 1 && (
          <div className="sidebar-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search chats"
            />
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Recent Chats Section */}
        <div className="recent-section-label">Recent Chats</div>

        <nav className="chats-scroll-list" aria-label="Recent Chats">
          {filteredConversations.length === 0 ? (
            <div className="no-chats-hint">
              {search ? 'No matching chats' : 'No recent chats'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId
              const isLoading = loadingIds.has(c.id)
              const isEditing = editingId === c.id

              return (
                <div key={c.id} className={`chat-item-row ${isActive ? 'active' : ''}`}>
                  {isEditing ? (
                    <div className="chat-rename-input-wrap">
                      <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDownRename(e, c.id)}
                        onBlur={() => saveRename(c.id)}
                        className="chat-rename-input"
                      />
                      <button
                        className="chat-save-rename-btn"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          saveRename(c.id)
                        }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="chat-select-btn"
                        onClick={() => onSelect(c.id)}
                        title={c.title}
                      >
                        <MessageSquare size={16} className="chat-bubble-icon" />
                        <span className="chat-title-text">{c.title}</span>
                        {isLoading && <span className="generating-dot" />}
                      </button>

                      <div className="chat-item-actions">
                        <button
                          className="chat-action-icon-btn"
                          onClick={(e) => startRename(c, e)}
                          aria-label={`Rename ${c.title}`}
                          title="Rename chat"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="chat-action-icon-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(c.id)
                          }}
                          aria-label={`Delete ${c.title}`}
                          title="Delete chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </nav>

        {/* Bottom Options: Settings, Help, About */}
        <div className="sidebar-bottom-actions">
          <button
            className="bottom-nav-btn"
            onClick={() => onOpenModal('settings')}
            aria-label="Settings"
          >
            <Settings size={17} />
            <span>Settings</span>
          </button>

          <button
            className="bottom-nav-btn"
            onClick={() => onOpenModal('help')}
            aria-label="Help"
          >
            <HelpCircle size={17} />
            <span>Help</span>
          </button>

          <button
            className="bottom-nav-btn"
            onClick={() => onOpenModal('about')}
            aria-label="About"
          >
            <Info size={17} />
            <span>About</span>
          </button>
        </div>
      </aside>
    </>
  )
}
