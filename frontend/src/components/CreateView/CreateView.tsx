import { useNavigate } from "react-router-dom";
import { AppHeader } from "src/components/AppHeader/AppHeader";
import { TaskForm } from "src/components/TaskForm/TaskForm";
import { createTask } from "src/services/task.service";
import type { Task } from "src/types/Task";
import type { User } from "src/types/User";

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface CreateViewProps {
  currentUser: User;
  onLogout: () => Promise<void>;
}

export const CreateView = ({
  currentUser,
  onLogout,
}: CreateViewProps): JSX.Element => {
  const navigate = useNavigate();

  const handleCreate = async (task: Partial<Task>) => {
    await createTask(task);
    navigate("/tasks");
  };

  return (
    <main className="app-layout">
      <AppHeader
        title="Create Task"
        fullName={currentUser.fullName}
        onLogout={onLogout}
        onProfileClick={() => navigate("/profile")}
        onBack={() => navigate("/tasks")}
      />

      <TaskForm
        submitLabel="Create Task"
        onSubmit={handleCreate}
        minDueDate={toLocalDateInputValue(new Date())}
        onCancel={() => navigate("/tasks")}
      />
    </main>
  );
};
