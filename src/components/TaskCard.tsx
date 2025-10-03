import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Task {
  id: string
  title: string
  description: string
  column: string
  position: number
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onDelete: (taskId: string) => void
  onUpdate: (taskId: string, title: string, description: string) => void
}

export default function TaskCard({ task, isDragging, onDelete, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    onUpdate(task.id, editTitle, editDescription)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setIsEditing(false)
  }

  if (isDragging) {
    return (
      <div className="task-card dragging">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="task-card editing">
        <input
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={e => setEditDescription(e.target.value)}
          placeholder="Task description (optional)"
          rows={3}
        />
        <div className="task-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card"
    >
      <div className="task-header" {...attributes} {...listeners}>
        <h3>{task.title}</h3>
        <div className="task-controls">
          <button 
            className="edit-btn" 
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
          >
            ✏️
          </button>
          <button 
            className="delete-btn" 
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
          >
            🗑️
          </button>
        </div>
      </div>
      {task.description && <p className="task-description" {...attributes} {...listeners}>{task.description}</p>}
    </div>
  )
}