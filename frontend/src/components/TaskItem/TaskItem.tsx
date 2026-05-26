import { useState } from "react";
import type { Task } from "../../types/Task";
import type { User } from "../../types/User";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { TaskForm } from "../TaskForm/TaskForm";

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
    && new Date(task.dueDate).getTime() < Date.now();

  return (
    <li className={`task-item ${task.isCompleted ? "done" : ""} ${isOverdue ? "overdue" : ""}`}>
      {!isEditing ? (
        <>
          <div className="task-item-row">
            <div className="task-item-content">
              <p>
                <strong>{task.description}</strong>
                {isOverdue && (
                  <span className="overdue-icon" title="Overdue" aria-label="Overdue">⚠</span>
                )}
              </p>
              <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</p>
            </div>

            <div className="task-item-actions" aria-label="Task actions">
              <button
                type="button"
                className="task-action-button secondary"
                onClick={() => setIsEditing(true)}
                aria-label="Edit"
                title="Edit"
              >
                <span aria-hidden="true">✎</span>
              </button>
              <button
                type="button"
                className="task-action-button"
                onClick={handleToggle}
                aria-label={task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                title={task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
              >
                <span aria-hidden="true">{task.isCompleted ? "☑" : "☐"}</span>
              </button>
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
