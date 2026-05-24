import { useEffect, useState } from "react";
import "./styles.css";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import {
  createTask,
  deleteTask,
  getStoredUser,
  getTasks,
  logout,
  updateTask,
} from "./services/api";
import type { Task } from "./types/Task";
import type { User } from "./types/User";

const App = (): JSX.Element => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  const loadTasks = async () => {
    if (!user) {
      return;
    }

    try {
      setLoadingTasks(true);
      setError("");
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [user]);

  const handleCreate = async (task: Partial<Task>) => {
    const createdTask = await createTask(task);
    setTasks((previous) => [createdTask, ...previous]);
  };

  const handleUpdate = async (taskId: string, updates: Partial<Task>) => {
    const updatedTask = await updateTask(taskId, updates);
    setTasks((previous) => previous.map((task) => (task.id === taskId ? updatedTask : task)));
  };

  const handleToggleComplete = async (task: Task) => {
    await handleUpdate(task.id, {
      ...task,
      isCompleted: !task.isCompleted,
    });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setTasks([]);
  };

  if (!user) {
    return (
      <main className="auth-layout">
        <h1>ToDo Management</h1>
        <p className="subtitle">Register or log in to manage your tasks.</p>
        <div className="auth-grid">
          <RegisterForm onAuthenticated={setUser} />
          <LoginForm onAuthenticated={setUser} />
          <ForgotPasswordForm />
          <ResetPasswordForm />
        </div>
      </main>
    );
  }

  return (
    <main className="app-layout">
      <header>
        <h1>Task Dashboard</h1>
        <p>Logged in as {user.username}</p>
        <button type="button" onClick={handleLogout} className="secondary">
          Logout
        </button>
      </header>

      <TaskForm submitLabel="Create Task" onSubmit={handleCreate} />

      {loadingTasks && <p>Loading tasks...</p>}
      {error && <p className="error">{error}</p>}
      {!loadingTasks && (
        <TaskList
          tasks={tasks}
          currentUser={user}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </main>
  );
};

export default App;
