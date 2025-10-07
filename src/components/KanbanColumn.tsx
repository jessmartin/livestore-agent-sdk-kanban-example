import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

interface Task {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly column: string
  readonly position: number
}

interface KanbanColumnProps {
  id: string
  title: string
  tasks: readonly Task[]
  onAddTask: () => void
  onDeleteTask: (taskId: string) => void
  onUpdateTask: (taskId: string, title: string, description: string) => void
}

export default function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  onAddTask,
  onDeleteTask,
  onUpdateTask 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'column-over' : ''}`}
    >
      <div className="column-header">
        <h2>{title}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              onDelete={onDeleteTask}
              onUpdate={onUpdateTask}
            />
          ))}
        </div>
      </SortableContext>

      <button className="add-task-btn" onClick={onAddTask}>
        + Add Task
      </button>
    </div>
  )
}