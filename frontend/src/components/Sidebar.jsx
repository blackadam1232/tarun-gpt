import { useState } from 'react'
import {
  HelpCircle,
  Info,
  Menu,
  MessageSquare,
  PanelLeftClose,
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
  onDelete,
  onClose,
  onOpenModal,
}) {
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

        {/* Recent Chats Section */}
        <div className="recent-section-label">Recent Chats</div>

        <nav className="chats-scroll-list" aria-label="Recent Chats">
          {conversations.length === 0 ? (
            <div className="no-chats-hint">No recent chats</div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeId
              const isLoading = loadingIds.has(c.id)

              return (
                <div key={c.id} className={`chat-item-row ${isActive ? 'active' : ''}`}>
                  <button
                    className="chat-select-btn"
                    onClick={() => onSelect(c.id)}
                    title={c.title}
                  >
                    <MessageSquare size={16} className="chat-bubble-icon" />
                    <span className="chat-title-text">{c.title}</span>
                    {isLoading && <span className="generating-dot" />}
                  </button>
                  <button
                    className="chat-delete-btn"
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
