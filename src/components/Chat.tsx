import { useState, useRef, useEffect } from 'react'
import { queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import { events, tables } from '../livestore/schema'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import './Chat.css'

const chatMessages$ = queryDb(
  tables.chatMessages.orderBy('createdAt', 'asc'),
  { label: 'chat-messages' }
)

const chatSession$ = queryDb(
  tables.chatSession.where({ id: 'current' }),
  { label: 'chat-session' }
)

export default function Chat() {
  const { store } = useStore()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = store.useQuery(chatMessages$)
  const sessionData = store.useQuery(chatSession$)
  const currentSessionId = sessionData[0]?.sessionId

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Send user message to LiveStore
    store.commit(
      events.chatMessageSent({
        id: crypto.randomUUID(),
        content: userMessage,
        role: 'user',
        createdAt: new Date(),
      })
    )

    setIsLoading(true)

    try {
      // Call Claude Agent SDK
      const result = query({
        prompt: userMessage,
        options: {
          continue: !!currentSessionId,
          allowedTools: ['WebSearch', 'WebFetch'],
          apiKey: import.meta.env.VITE_ANTHROPIC_KEY,
        }
      })

      let newSessionId: string | null = null

      // Process messages from the SDK
      for await (const message of result) {
        // Store session ID from any message
        if (message.session_id && !newSessionId) {
          newSessionId = message.session_id
        }

        // Handle assistant messages
        if (message.type === 'assistant') {
          const content = message.message.content

          // Look for tool uses and show them
          for (const block of content) {
            if (block.type === 'tool_use') {
              const toolName = block.name
              const toolInput = JSON.stringify(block.input, null, 2)

              let toolMessage = ''
              if (toolName === 'WebSearch') {
                toolMessage = `🔍 Searching the web for: "${block.input.query}"`
              } else if (toolName === 'WebFetch') {
                toolMessage = `🌐 Fetching: ${block.input.url}`
              } else {
                toolMessage = `🔧 Using tool: ${toolName}`
              }

              store.commit(
                events.chatMessageSent({
                  id: crypto.randomUUID(),
                  content: toolMessage,
                  role: 'assistant',
                  createdAt: new Date(),
                })
              )
            } else if (block.type === 'text' && block.text.trim()) {
              // Show assistant text response
              store.commit(
                events.chatMessageSent({
                  id: crypto.randomUUID(),
                  content: block.text,
                  role: 'assistant',
                  createdAt: new Date(),
                })
              )
            }
          }
        }
      }

      // Store the session ID if we got a new one
      if (newSessionId && newSessionId !== currentSessionId) {
        store.commit(
          events.chatSessionUpdated({
            sessionId: newSessionId,
          })
        )
      }
    } catch (error) {
      console.error('Error calling Claude SDK:', error)
      store.commit(
        events.chatMessageSent({
          id: crypto.randomUUID(),
          content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          role: 'assistant',
          createdAt: new Date(),
        })
      )
    } finally {
      setIsLoading(false)
    }
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