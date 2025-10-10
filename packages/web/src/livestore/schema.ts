import { Events, makeSchema, Schema, State } from '@livestore/livestore'

export const tables = {
  tasks: State.SQLite.table({
    name: 'tasks',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      title: State.SQLite.text({ default: '' }),
      description: State.SQLite.text({ default: '' }),
      column: State.SQLite.text({ default: 'todo' }),
      position: State.SQLite.integer({ default: 0 }),
      createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
      updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    },
  }),
  chatMessages: State.SQLite.table({
    name: 'chatMessages',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      content: State.SQLite.text({ default: '' }),
      role: State.SQLite.text({ default: 'user' }),
      createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    },
  }),
  chatSession: State.SQLite.table({
    name: 'chatSession',
    columns: {
      id: State.SQLite.text({ primaryKey: true }), // Always 'current'
      sessionId: State.SQLite.text({ default: '' }),
    },
  }),
}

export const events = {
  taskCreated: Events.synced({
    name: 'v1.TaskCreated',
    schema: Schema.Struct({ 
      id: Schema.String, 
      title: Schema.String,
      description: Schema.String,
      column: Schema.String,
      position: Schema.Number,
      createdAt: Schema.Date,
    }),
  }),
  taskMoved: Events.synced({
    name: 'v1.TaskMoved',
    schema: Schema.Struct({ 
      id: Schema.String, 
      column: Schema.String,
      position: Schema.Number,
      updatedAt: Schema.Date,
    }),
  }),
  taskUpdated: Events.synced({
    name: 'v1.TaskUpdated',
    schema: Schema.Struct({ 
      id: Schema.String, 
      title: Schema.optional(Schema.String),
      description: Schema.optional(Schema.String),
      updatedAt: Schema.Date,
    }),
  }),
  taskDeleted: Events.synced({
    name: 'v1.TaskDeleted',
    schema: Schema.Struct({ id: Schema.String }),
  }),
  chatMessageSent: Events.synced({
    name: 'v1.ChatMessageSent',
    schema: Schema.Struct({
      id: Schema.String,
      content: Schema.String,
      role: Schema.Literal('user', 'assistant'),
      createdAt: Schema.Date,
    }),
  }),
  chatSessionUpdated: Events.synced({
    name: 'v1.ChatSessionUpdated',
    schema: Schema.Struct({
      sessionId: Schema.String,
    }),
  }),
}

const materializers = State.SQLite.materializers(events, {
  'v1.TaskCreated': ({ id, title, description, column, position, createdAt }) => 
    tables.tasks.insert({ id, title, description, column, position, createdAt, updatedAt: createdAt }),
  'v1.TaskMoved': ({ id, column, position, updatedAt }) => 
    tables.tasks.update({ column, position, updatedAt }).where({ id }),
  'v1.TaskUpdated': ({ id, title, description, updatedAt }) => {
    const updates: { updatedAt: Date; title?: string; description?: string } = { updatedAt }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    return tables.tasks.update(updates).where({ id })
  },
  'v1.TaskDeleted': ({ id }) => 
    tables.tasks.delete().where({ id }),
  'v1.ChatMessageSent': ({ id, content, role, createdAt }) =>
    tables.chatMessages.insert({ id, content, role, createdAt }),
  'v1.ChatSessionUpdated': ({ sessionId }) =>
    tables.chatSession.insert({ id: 'current', sessionId }).onConflict('id', 'replace'),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })