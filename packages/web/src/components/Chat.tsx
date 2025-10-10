import { useState, useRef, useEffect } from 'react'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import { events, tables } from '../livestore/schema'
import './Chat.css'

const chatMessages$ = queryDb(
  tables.chatMessages.orderBy('createdAt', 'asc'),
  { label: 'chat-messages' }
)

export default function Chat() {
  const { store } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingMessageTimestamp, setPendingMessageTimestamp] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = store.useQuery(chatMessages$)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!pendingMessageTimestamp) return

    const hasAssistantReply = messages.some((message) => {
      if (message.role !== 'assistant') return false
      const createdAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt)
      return createdAt.getTime() >= pendingMessageTimestamp
    })

    if (hasAssistantReply) {
      setIsLoading(false)
      setPendingMessageTimestamp(null)
    }
  }, [messages, pendingMessageTimestamp])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    const createdAt = new Date()

    // Send user message to LiveStore
    store.commit(
      events.chatMessageSent({
        id: crypto.randomUUID(),
        content: userMessage,
        role: 'user',
        createdAt,
      })
    )

    setIsLoading(true)

    setPendingMessageTimestamp(createdAt.getTime())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Assistant</h2>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Start a conversation with the AI assistant!</p>
          </div>
        )}
        
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`chat-message ${message.role}`}
          >
            <div className="message-role">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-role">🤖</div>
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
        />
        <button 
          className="chat-send-btn" 
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  )
}
