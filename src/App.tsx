import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { schema } from './livestore/schema'
import LiveStoreWorker from './livestore.worker.ts?worker'
import KanbanBoard from './components/KanbanBoard'
import './App.css'

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

// Get sessionId from URL query parameter
const getSessionIdFromUrl = (): string => {
  const params = new URLSearchParams(window.location.search)
  return params.get('sessionId') || 'kanban-board-store'
}

function App() {
  const storeId = getSessionIdFromUrl()

  return (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <div className="loading">Loading LiveStore ({_.stage})...</div>}
      batchUpdates={batchUpdates}
      storeId={storeId}
    >
      <KanbanBoard />
    </LiveStoreProvider>
  )
}

export default App
