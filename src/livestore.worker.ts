import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema } from './livestore/schema'

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({
      url: import.meta.env.VITE_SYNC_URL || 'ws://localhost:8787'
    }),
    initialSyncOptions: {
      _tag: 'Blocking',
      timeout: 5000
    }
  }
})