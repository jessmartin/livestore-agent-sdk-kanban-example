import {
  type Adapter,
  ClientSessionLeaderThreadProxy,
  makeClientSession,
  type SyncOptions,
  UnexpectedError,
} from '@livestore/common'
import {
  configureConnection,
  Eventlog,
  LeaderThreadCtx,
  makeLeaderThreadLayer,
  type LeaderSqliteDb,
  type ShutdownChannel,
} from '@livestore/common/leader-thread'
import type { LiveStoreSchema } from '@livestore/common/schema'
import { LiveStoreEvent } from '@livestore/common/schema'
import { sqliteDbFactory } from '@livestore/sqlite-wasm/node'
import { loadSqlite3Wasm } from '@livestore/sqlite-wasm/load-wasm'
import { Effect, Layer, SubscriptionRef, WebChannel } from '@livestore/utils/effect'
import { nanoid } from '@livestore/utils/nanoid'

type MakeSqliteDb = ReturnType<typeof sqliteDbFactory>

export interface NodeAdapterOptions {
  sync?: SyncOptions
  clientId?: string
  sessionId?: string
}

export const makeNodeAdapter = (options: NodeAdapterOptions = {}): Adapter => (adapterArgs) =>
  Effect.gen(function* () {
    const { schema, storeId, syncPayload, devtoolsEnabled } = adapterArgs

    if (devtoolsEnabled) {
      console.warn('[LiveStore] Devtools are not supported in the node adapter. Continuing without devtools.')
    }

    const sqlite3 = yield* Effect.promise(() => loadSqlite3Wasm())
    const makeSqliteDb = sqliteDbFactory({ sqlite3 })

    const sessionDb = yield* makeSqliteDb({ _tag: 'in-memory' })

    const clientId = options.clientId ?? nanoid(6)
    const sessionId = options.sessionId ?? nanoid(6)

    const { leaderThread, initialSnapshot } = yield* makeLeaderThread({
      schema,
      storeId,
      clientId,
      makeSqliteDb,
      syncOptions: options.sync,
      syncPayload,
    })

    sessionDb.import(initialSnapshot)

    const lockStatus = yield* SubscriptionRef.make<'has-lock' | 'no-lock'>('has-lock')

    return yield* makeClientSession({
      ...adapterArgs,
      clientId,
      sessionId,
      sqliteDb: sessionDb,
      leaderThread,
      lockStatus,
      isLeader: true,
      webmeshMode: 'direct',
      connectWebmeshNode: () => Effect.void,
      registerBeforeUnload: () => () => {},
    })
  }).pipe(UnexpectedError.mapToUnexpectedError)

type MakeLeaderThreadArgs = {
  schema: LiveStoreSchema
  storeId: string
  clientId: string
  makeSqliteDb: MakeSqliteDb
  syncOptions: SyncOptions | undefined
  syncPayload: unknown
}

const makeLeaderThread = ({
  schema,
  storeId,
  clientId,
  makeSqliteDb,
  syncOptions,
  syncPayload,
}: MakeLeaderThreadArgs): Effect.Effect<
  {
    leaderThread: ReturnType<typeof ClientSessionLeaderThreadProxy.of>
    initialSnapshot: Uint8Array<ArrayBuffer>
  },
  UnexpectedError
> =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<never>()

    const makeDb = (_kind: 'state' | 'eventlog') =>
      makeSqliteDb({
        _tag: 'in-memory',
        configureDb: (db) =>
          configureConnection(db, { foreignKeys: true }).pipe(Effect.provide(runtime), Effect.runSync),
      })

    const [dbState, dbEventlog] = (yield* Effect.all([
      makeDb('state'),
      makeDb('eventlog'),
    ], { concurrency: 2 })) as [LeaderSqliteDb, LeaderSqliteDb]

    const shutdownChannel: ShutdownChannel = yield* WebChannel.noopChannel()

    const layer = yield* Layer.build(
      makeLeaderThreadLayer({
        schema,
        storeId,
        clientId,
        makeSqliteDb,
        syncOptions,
        syncPayload: syncPayload as any,
        dbState,
        dbEventlog,
        devtoolsOptions: { enabled: false },
        shutdownChannel,
      }),
    )

    const result = yield* Effect.gen(function* () {
      const {
        dbState: leaderDbState,
        dbEventlog: leaderDbEventlog,
        syncProcessor,
        extraIncomingMessagesQueue,
        initialState,
      } = yield* LeaderThreadCtx

      const initialLeaderHead = Eventlog.getClientHeadFromDb(leaderDbEventlog)

      const leaderThread = ClientSessionLeaderThreadProxy.of({
        events: {
          pull: ({ cursor }) => syncProcessor.pull({ cursor }),
          push: (batch) =>
            syncProcessor.push(
              batch.map((item) => new LiveStoreEvent.EncodedWithMeta(item)),
              { waitForProcessing: true },
            ),
        },
        initialState: {
          leaderHead: initialLeaderHead,
          migrationsReport: initialState.migrationsReport,
        },
        export: Effect.sync(() => leaderDbState.export()),
        getEventlogData: Effect.sync(() => leaderDbEventlog.export()),
        getSyncState: syncProcessor.syncState,
        sendDevtoolsMessage: (message) => extraIncomingMessagesQueue.offer(message),
      })
      
      const initialSnapshot = leaderDbState.export()

      return { leaderThread, initialSnapshot }
    }).pipe(Effect.provide(layer))

    return result
  })
