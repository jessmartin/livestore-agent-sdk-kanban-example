import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { events, tables } from '../livestore/schema'
import { queryDb } from '@livestore/livestore'

/**
 * Creates an MCP server that provides LiveStore operations as tools
 * for the Claude Agent SDK.
 */
export function createLiveStoreMcpServer(store: any) {
  return createSdkMcpServer({
    name: 'LiveStore',
    version: '1.0.0',
    tools: [
      // Task Management Tools
      tool(
        'createTask',
        'Create a new task on the Kanban board with a title, description, and column (todo/doing/done)',
        {
          title: z.string().describe('The title of the task'),
          description: z.string().describe('A detailed description of the task'),
          column: z.enum(['todo', 'doing', 'done']).describe('The column to place the task in'),
        },
        async ({ title, description, column }) => {
          // Get current max position in the column
          const tasksInColumn = await store.query(
            queryDb(tables.tasks.where({ column }), { label: 'tasks-in-column' })
          )
          const maxPosition = tasksInColumn.reduce((max: number, task: any) => Math.max(max, task.position), -1)

          const taskId = crypto.randomUUID()
          await store.commit(
            events.taskCreated({
              id: taskId,
              title,
              description,
              column,
              position: maxPosition + 1,
              createdAt: new Date(),
            })
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `Created task "${title}" in ${column} column with ID: ${taskId}`,
              },
            ],
          }
        }
      ),

      tool(
        'listTasks',
        'List all tasks on the Kanban board, optionally filtered by column',
        {
          column: z.enum(['todo', 'doing', 'done']).optional().describe('Filter tasks by column (optional)'),
        },
        async ({ column }) => {
          const query = column
            ? queryDb(tables.tasks.where({ column }).orderBy('position', 'asc'), { label: 'tasks-by-column' })
            : queryDb(tables.tasks.orderBy('column', 'asc').orderBy('position', 'asc'), { label: 'all-tasks' })

          const tasks = await store.query(query)

          if (tasks.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: column ? `No tasks in ${column} column` : 'No tasks on the board',
                },
              ],
            }
          }

          const taskList = tasks.map((task: any) =>
            `- [${task.column}] ${task.title}: ${task.description} (ID: ${task.id})`
          ).join('\n')

          return {
            content: [
              {
                type: 'text' as const,
                text: `Tasks:\n${taskList}`,
              },
            ],
          }
        }
      ),

      tool(
        'moveTask',
        'Move a task to a different column on the Kanban board',
        {
          taskId: z.string().describe('The ID of the task to move'),
          column: z.enum(['todo', 'doing', 'done']).describe('The destination column'),
        },
        async ({ taskId, column }) => {
          // Verify task exists
          const existingTasks = await store.query(
            queryDb(tables.tasks.where({ id: taskId }), { label: 'task-by-id' })
          )

          if (existingTasks.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Task with ID ${taskId} not found`,
                },
              ],
            }
          }

          const task = existingTasks[0]

          // Get max position in destination column
          const tasksInColumn = await store.query(
            queryDb(tables.tasks.where({ column }), { label: 'tasks-in-dest-column' })
          )
          const maxPosition = tasksInColumn.reduce((max: number, t: any) => Math.max(max, t.position), -1)

          await store.commit(
            events.taskMoved({
              id: taskId,
              column,
              position: maxPosition + 1,
              updatedAt: new Date(),
            })
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `Moved task "${task.title}" to ${column} column`,
              },
            ],
          }
        }
      ),

      tool(
        'updateTask',
        'Update the title or description of an existing task',
        {
          taskId: z.string().describe('The ID of the task to update'),
          title: z.string().optional().describe('New title for the task (optional)'),
          description: z.string().optional().describe('New description for the task (optional)'),
        },
        async ({ taskId, title, description }) => {
          // Verify task exists
          const existingTasks = await store.query(
            queryDb(tables.tasks.where({ id: taskId }), { label: 'task-by-id' })
          )

          if (existingTasks.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Task with ID ${taskId} not found`,
                },
              ],
            }
          }

          if (!title && !description) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'Error: Must provide at least one of title or description to update',
                },
              ],
            }
          }

          await store.commit(
            events.taskUpdated({
              id: taskId,
              title,
              description,
              updatedAt: new Date(),
            })
          )

          const updates: string[] = []
          if (title) updates.push('title')
          if (description) updates.push('description')

          return {
            content: [
              {
                type: 'text' as const,
                text: `Updated ${updates.join(' and ')} for task ${taskId}`,
              },
            ],
          }
        }
      ),

      tool(
        'deleteTask',
        'Delete a task from the Kanban board',
        {
          taskId: z.string().describe('The ID of the task to delete'),
        },
        async ({ taskId }) => {
          // Verify task exists
          const existingTasks = await store.query(
            queryDb(tables.tasks.where({ id: taskId }), { label: 'task-by-id' })
          )

          if (existingTasks.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Task with ID ${taskId} not found`,
                },
              ],
            }
          }

          const task = existingTasks[0]

          await store.commit(
            events.taskDeleted({
              id: taskId,
            })
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `Deleted task "${task.title}"`,
              },
            ],
          }
        }
      ),
    ],
  })
}
