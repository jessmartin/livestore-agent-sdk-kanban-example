import * as SyncBackend from '@livestore/sync-cf/cf-worker'

// Create the Durable Object for managing WebSocket connections
export class SyncBackendDO extends SyncBackend.makeDurableObject({
  onPush: async (message, context) => {
    console.log(
      '📤 onPush:',
      message.batch.length,
      'events',
      'storeId:',
      context.storeId
    )
  },
  onPull: async function (message, context) {
    console.log('📥 onPull:', 'storeId:', context.storeId)
  },
}) {}

// Create worker with no auth validation for spike
export default SyncBackend.makeWorker({
  syncBackendBinding: 'WEBSOCKET_SERVER',
  validatePayload: async () => {
    // No validation for spike - allow all connections
    console.log('🔌 Client connecting (no auth)')
  },
  enableCORS: true,
})
