import { useState } from "react";
import type { Task } from "../types/Task";
import type { User } from "../types/User";
import { TaskForm } from "./TaskForm";

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
  const [error, setError] = useState("");

  const handleToggle = async () => {
    setError("");
    try {
      await onToggleComplete(task);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to update task status.");
    }
  };

  const handleDelete = async () => {
    setError("");
    try {
      setIsDeleting(true);
      await onDelete(task.id);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (updates: Partial<Task>) => {
    setError("");
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
          <h4>
            {task.title}
            {isOverdue && (
              <span className="overdue-icon" title="Overdue" aria-label="Overdue">⚠</span>
            )}
          </h4>
          <p>{task.description || "No description"}</p>
          <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</p>

          <div className="actions">
            <button type="button" onClick={() => setIsEditing(true)} className="secondary">
              Edit
            </button>
            <button type="button" onClick={handleToggle}>
              {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
            </button>
            <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="danger">
              Delete
            </button>
          </div>

          {isDeleteModalOpen && (
            <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby={`delete-task-title-${task.id}`}>
              <div className="modal-card">
                <h5 id={`delete-task-title-${task.id}`}>Delete task?</h5>
                <p>This action cannot be undone.</p>
                <div className="actions">
                  <button type="button" className="danger" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && <p className="error">{error}</p>}
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
