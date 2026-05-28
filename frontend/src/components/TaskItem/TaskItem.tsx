import { useState } from "react";
import type { Task } from "src/types/Task";
import type { User } from "src/types/User";
import { ConfirmationModal } from "src/components/ConfirmationModal/ConfirmationModal";
import { TaskForm } from "src/components/TaskForm/TaskForm";

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateOnlyForDisplay = (dateOnly: string): string => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
};

const getTodayDateOnly = (): string => toLocalDateInputValue(new Date());

interface TaskItemProps {
  task: Task;
  currentUser: User;
  onToggleComplete: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskItem = ({
  task,
  currentUser,
  onToggleComplete,
  onDelete,
  onUpdate,
}: TaskItemProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      await onToggleComplete(task);
    } catch {
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(task.id);
      setIsDeleteModalOpen(false);
    } catch {
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (updates: Partial<Task>) => {
    await onUpdate(task.id, {
      ...task,
      ...updates,
    });
    setIsEditing(false);
  };

  const isOverdue =
    !task.isCompleted
    && !!task.dueDate
    && task.dueDate < getTodayDateOnly();

  return (
    <li className={`task-item ${task.isCompleted ? "done" : ""} ${isOverdue ? "overdue" : ""}`}>
      {!isEditing ? (
        <>
          <div className="task-item-row">
            <div className="task-item-content">
              <p className="task-item-title-row">
                <button
                  type="button"
                  className={`task-status-toggle ${task.isCompleted ? "completed" : ""}`}
                  onClick={handleToggle}
                  aria-label={task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                  title={task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                >
                  {task.isCompleted && (
                    <span className="task-status-check" aria-hidden="true">✓</span>
                  )}
                </button>
                <strong>{task.description}</strong>
                {isOverdue && (
                  <span className="overdue-icon" title="Overdue" aria-label="Overdue">⚠</span>
                )}
              </p>
              <p>Due: {task.dueDate ? formatDateOnlyForDisplay(task.dueDate) : "None"}</p>
            </div>

            <div className="task-item-actions" aria-label="Task actions">
              {!task.isCompleted && (
                <button
                  type="button"
                  className="task-action-button secondary"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit"
                  title="Edit"
                >
                  <span aria-hidden="true">✎</span>
                </button>
              )}
              <button
                type="button"
                className="task-action-button danger"
                onClick={() => setIsDeleteModalOpen(true)}
                aria-label="Delete"
                title="Delete"
              >
                <span aria-hidden="true">🗑</span>
              </button>
            </div>
          </div>

          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            modalTitle="Delete task?"
            content="Are you sure you want to delete this task?"
            onConfirm={handleDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
            isConfirming={isDeleting}
            confirmButtonTitle="Delete"
          />
        </>
      ) : (
        <TaskForm
          submitLabel="Save Changes"
          initialValue={task}
          onSubmit={handleUpdate}
          minDueDate={toLocalDateInputValue(new Date())}
          enforceNoPastDueDateChanges
          onCancel={() => setIsEditing(false)}
        />
      )}
    </li>
  );
};
