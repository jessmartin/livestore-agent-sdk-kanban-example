import { useState } from "react";
import { queryDb } from "@livestore/livestore";
import { useStore } from "@livestore/react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { events, tables } from "../livestore/schema";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import Chat from "./Chat";
import "./KanbanBoard.css";

const columns = ["todo", "doing", "done"] as const;
type ColumnType = (typeof columns)[number];

const columnTitles: Record<ColumnType, string> = {
  todo: "To Do",
  doing: "In Progress",
  done: "Done",
};

const tasksByColumn$ = (column: string) =>
  queryDb(tables.tasks.where({ column }).orderBy("position", "asc"), {
    label: `tasks-${column}`,
  });

export default function KanbanBoard() {
  const { store } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<ColumnType | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const todoTasks = store.useQuery(tasksByColumn$("todo"));
  const doingTasks = store.useQuery(tasksByColumn$("doing"));
  const doneTasks = store.useQuery(tasksByColumn$("done"));

  const allTasks = [...todoTasks, ...doingTasks, ...doneTasks];
  const activeTask = allTasks.find((task) => task.id === activeId);

  const tasksByColumnMap: Record<ColumnType, typeof todoTasks> = {
    todo: todoTasks,
    doing: doingTasks,
    done: doneTasks,
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedTask = allTasks.find((task) => task.id === active.id);
    if (!draggedTask) return;

    const overId = over.id as string;
    let targetColumn: ColumnType;
    let targetPosition = 0;

    if (columns.includes(overId as ColumnType)) {
      targetColumn = overId as ColumnType;
      const tasksInColumn = tasksByColumnMap[targetColumn];
      targetPosition = tasksInColumn.length;
    } else {
      const overTask = allTasks.find((task) => task.id === overId);
      if (!overTask) return;

      targetColumn = overTask.column as ColumnType;
      const tasksInColumn = tasksByColumnMap[targetColumn];
      const overIndex = tasksInColumn.findIndex((t) => t.id === overTask.id);

      const draggedIndex = tasksInColumn.findIndex(
        (t) => t.id === draggedTask.id
      );

      if (draggedTask.column === targetColumn && draggedIndex !== -1) {
        targetPosition = overIndex > draggedIndex ? overIndex : overIndex;
      } else {
        targetPosition = overIndex + 1;
      }
    }

    if (
      draggedTask.column !== targetColumn ||
      draggedTask.position !== targetPosition
    ) {
      const tasksToUpdate = tasksByColumnMap[targetColumn]
        .filter((t) => t.id !== draggedTask.id && t.position >= targetPosition)
        .map((t) => ({ id: t.id, position: t.position + 1 }));

      const updateEvents = [
        events.taskMoved({
          id: draggedTask.id,
          column: targetColumn,
          position: targetPosition,
          updatedAt: new Date(),
        }),
        ...tasksToUpdate.map((t) =>
          events.taskMoved({
            id: t.id,
            column: targetColumn,
            position: t.position,
            updatedAt: new Date(),
          })
        ),
      ];

      store.commit(...updateEvents);
    }
  };

  const handleAddTask = (column: ColumnType) => {
    if (newTaskTitle.trim()) {
      const tasksInColumn = tasksByColumnMap[column];
      const position = tasksInColumn.length;

      store.commit(
        events.taskCreated({
          id: crypto.randomUUID(),
          title: newTaskTitle.trim(),
          description: "",
          column,
          position,
          createdAt: new Date(),
        })
      );

      setNewTaskTitle("");
      setNewTaskColumn(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    store.commit(events.taskDeleted({ id: taskId }));
  };

  const handleUpdateTask = (
    taskId: string,
    title: string,
    description: string
  ) => {
    store.commit(
      events.taskUpdated({
        id: taskId,
        title,
        description,
        updatedAt: new Date(),
      })
    );
  };

  return (
    <div className="kanban-app">
      <div className="kanban-container">
        <h1>Kanban Board</h1>

        <div className="kanban-main">
          <Chat />

          <div className="kanban-board-wrapper">
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="kanban-board">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column}
                    id={column}
                    title={columnTitles[column]}
                    tasks={[...tasksByColumnMap[column]]}
                    onAddTask={() => setNewTaskColumn(column)}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTask={handleUpdateTask}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <TaskCard
                    task={activeTask}
                    isDragging
                    onDelete={() => {}}
                    onUpdate={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {newTaskColumn && (
        <div className="modal-overlay" onClick={() => setNewTaskColumn(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Task to {columnTitles[newTaskColumn]}</h3>
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTask(newTaskColumn);
                }
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => handleAddTask(newTaskColumn)}>
                Add Task
              </button>
              <button onClick={() => setNewTaskColumn(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
