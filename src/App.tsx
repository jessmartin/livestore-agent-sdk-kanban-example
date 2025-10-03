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

function App() {
  return (
    <LiveStoreProvider
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <div className="loading">Loading LiveStore ({_.stage})...</div>}
      batchUpdates={batchUpdates}
      storeId="kanban-board-store"
    >
      <KanbanBoard />
    </LiveStoreProvider>
  )
}

export default App
