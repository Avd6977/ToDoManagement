import type { Task } from "../types/Task";
import type { User } from "../types/User";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  currentUser: User;
  onToggleComplete: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskList = ({
  tasks,
  currentUser,
  onToggleComplete,
  onDelete,
  onUpdate,
}: TaskListProps): JSX.Element => {
  if (!tasks.length) {
    return <p>No tasks yet.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          currentUser={currentUser}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </ul>
  );
};
