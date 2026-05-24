import { useState } from "react";
import type { Task } from "../types/Task";
import type { User } from "../types/User";
import { TaskForm } from "./TaskForm";

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
      await onDelete(task.id);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to delete task.");
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

  return (
    <li className={`task-item ${task.isCompleted ? "done" : ""}`}>
      {!isEditing ? (
        <>
          <h4>{task.title}</h4>
          <p>{task.description || "No description"}</p>
          <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</p>

          <div className="actions">
            <button type="button" onClick={() => setIsEditing(true)} className="secondary">
              Edit
            </button>
            <button type="button" onClick={handleToggle}>
              {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
            </button>
            <button type="button" onClick={handleDelete} className="danger">
              Delete
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </>
      ) : (
        <TaskForm
          submitLabel="Save Changes"
          initialValue={task}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </li>
  );
};
