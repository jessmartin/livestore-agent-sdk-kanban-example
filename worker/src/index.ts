import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

// Create the Durable Object for managing WebSocket connections
export class SyncDurableObject extends makeDurableObject({
  // Basic configuration - no auth for spike
  allowAnonymous: true,
}) {}

// Create the worker that handles HTTP and WebSocket requests
export default makeWorker({
  // Basic configuration for spike
  allowAnonymous: true,

  // CORS settings for local development
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
  },
})
