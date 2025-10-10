import { query, type SDKAssistantMessage, type SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { createStorePromise, queryDb } from '@livestore/livestore'
import { makeWsSync } from '@livestore/sync-cf/client'
import { Effect } from '@livestore/utils/effect'
import { events, schema, tables } from '../web/src/livestore/schema'
import { makeNodeAdapter } from './node-adapter'

type ChatMessageRow = {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
}

type ChatSessionRow = {
  id: string
  sessionId: string
}

const anthropicKey = process.env.ANTHROPIC_API_KEY
if (!anthropicKey) {
  throw new Error('ANTHROPIC_API_KEY is required to run the LiveStore agent server')
}

const syncUrl = process.env.LIVESTORE_SYNC_URL ?? 'ws://localhost:8787'
const storeId = process.env.LIVESTORE_STORE_ID ?? 'kanban-board-store'

const adapter = makeNodeAdapter({
  sync: {
    backend: makeWsSync({ url: syncUrl }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
    livePull: true,
  },
})

async function main() {
  const store = await createStorePromise({
    schema,
    storeId,
    adapter,
    batchUpdates: (run) => run(),
    disableDevtools: true,
  })

  await store.boot
  console.log('[Server] LiveStore agent server booted')

  const processedMessageIds = new Set<string>()
  let initialised = false

  const chatMessagesQuery = queryDb(
    tables.chatMessages.orderBy('createdAt', 'asc'),
    { label: 'server-chat-messages' },
  )

  store.subscribe(chatMessagesQuery, {
    label: 'server-chat-subscription',
    onUpdate: (rows) => {
      const messages = rows as ChatMessageRow[]

      if (!initialised) {
        for (const message of messages) {
          processedMessageIds.add(message.id)
        }
        initialised = true
        return
      }

      for (const message of messages) {
        if (processedMessageIds.has(message.id)) continue

        processedMessageIds.add(message.id)

        if (message.role === 'user') {
          void handleUserMessage(store, message).catch((error) => {
            console.error('[Server] Failed to process message', message.id, error)
            store.commit(
              events.chatMessageSent({
                id: crypto.randomUUID(),
                content: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                role: 'assistant',
                createdAt: new Date(),
              }),
            )
          })
        }
      }
    },
  })

  process.on('SIGINT', () => {
    console.log('Shutting down LiveStore agent server...')
    Effect.runPromise(store.shutdown())
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Failed to shutdown cleanly', error)
        process.exit(1)
      })
  })

  await new Promise(() => {})
}

async function handleUserMessage(store: Awaited<ReturnType<typeof createStorePromise>>, message: ChatMessageRow) {
  console.log('[Server] Processing chat message', message.id)

  const sessionRow = store.query(tables.chatSession.where({ id: 'current' })) as ChatSessionRow[]
  const currentSessionId = sessionRow[0]?.sessionId

  const stream = query({
    prompt: message.content,
    options: {
      continue: Boolean(currentSessionId),
      allowedTools: ['WebSearch', 'WebFetch'],
      apiKey: anthropicKey,
    },
  })

  let sessionId: string | undefined = currentSessionId ?? undefined

  try {
    for await (const sdkMessage of stream) {
      if (sdkMessage.session_id) {
        sessionId = sdkMessage.session_id
      }

      await handleSdkMessage(store, sdkMessage)
    }
  } catch (error) {
    console.error('[Server] Error from Claude Agent SDK', error)
    store.commit(
      events.chatMessageSent({
        id: crypto.randomUUID(),
        content: `❌ Claude error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        createdAt: new Date(),
      }),
    )
  }

  if (sessionId && sessionId !== currentSessionId) {
    store.commit(events.chatSessionUpdated({ sessionId }))
  }
}

async function handleSdkMessage(store: Awaited<ReturnType<typeof createStorePromise>>, sdkMessage: SDKMessage) {
  if (sdkMessage.type === 'assistant') {
    await handleAssistantMessage(store, sdkMessage)
    return
  }

  if (sdkMessage.type === 'result') {
    console.log('[Server] Claude result', {
      durationMs: sdkMessage.duration_ms,
      totalCostUsd: sdkMessage.total_cost_usd,
      usage: sdkMessage.usage,
    })
    return
  }
}

async function handleAssistantMessage(store: Awaited<ReturnType<typeof createStorePromise>>, sdkMessage: SDKAssistantMessage) {
  for (const block of sdkMessage.message.content) {
    if (block.type === 'tool_use') {
      const description = describeToolUse(block.name, block.input)
      store.commit(
        events.chatMessageSent({
          id: crypto.randomUUID(),
          content: description,
          role: 'assistant',
          createdAt: new Date(),
        }),
      )
    } else if (block.type === 'text') {
      const text = block.text.trim()
      if (text.length > 0) {
        store.commit(
          events.chatMessageSent({
            id: crypto.randomUUID(),
            content: text,
            role: 'assistant',
            createdAt: new Date(),
          }),
        )
      }
    }
  }
}

function describeToolUse(toolName: string, input: Record<string, unknown>) {
  if (toolName === 'WebSearch' && typeof input.query === 'string') {
    return `🔍 Searching the web for: "${input.query}"`
  }

  if (toolName === 'WebFetch' && typeof input.url === 'string') {
    return `🌐 Fetching: ${input.url}`
  }

  return `🔧 Using tool: ${toolName}`
}

void main()
