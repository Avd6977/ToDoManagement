import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import { AppHeader } from "./components/AppHeader";
import { ProfileForm } from "./components/ProfileForm";
import {
  createTask,
  deleteTask,
  getStoredUser,
  getTasks,
  logout,
  type TaskStatusFilter,
  updateProfile,
  updateStoredUserFullName,
  updateTask,
} from "./services/api";
import type { Task } from "./types/Task";
import type { User } from "./types/User";

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const App = (): JSX.Element => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState("");
  const [loadingOpenTasks, setLoadingOpenTasks] = useState(false);
  const [loadingCompletedTasks, setLoadingCompletedTasks] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [canResetPassword, setCanResetPassword] = useState(false);
  const navigate = useNavigate();

  const loadTasks = async (status: TaskStatusFilter, options?: { force?: boolean }) => {
    if (!user) {
      return;
    }

    try {
      if (status == "completed")
      {
        if (completedTasks != null && !options?.force)
        {
          return;
        }

        setLoadingCompletedTasks(true);
      }
      else
      {
        setLoadingOpenTasks(true);
      }

      setError("");
      const fetchedTasks = await getTasks({ search: searchTerm, status });
      if (status == "completed")
      {
        setCompletedTasks(fetchedTasks);
      }
      else
      {
        setOpenTasks(fetchedTasks);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load tasks.");
    } finally {
      if (status == "completed")
      {
        setLoadingCompletedTasks(false);
      }
      else
      {
        setLoadingOpenTasks(false);
      }
    }
  };

  useEffect(() => {
    void loadTasks("open", { force: true });
    setCompletedTasks(null);
  }, [user, searchTerm]);

  useEffect(() => {
    if (isCompletedExpanded && completedTasks == null)
    {
      void loadTasks("completed");
    }
  }, [isCompletedExpanded, completedTasks, user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setOpenTasks([]);
      setCompletedTasks(null);
      setIsCompletedExpanded(false);
      setSearchTerm("");
      navigate("/");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  const handleCreate = async (task: Partial<Task>) => {
    await createTask(task);
    await loadTasks("open", { force: true });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true });
    }
    navigate("/tasks");
  };

  const handleUpdate = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    await loadTasks("open", { force: true });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!task.isCompleted)
    {
      setCompletedTasks(null);
    }

    await handleUpdate(task.id, {
      ...task,
      isCompleted: !task.isCompleted,
    });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    await loadTasks("open", { force: true });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true });
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setOpenTasks([]);
    setCompletedTasks(null);
    setIsCompletedExpanded(false);
    setSearchTerm("");
  };

  const handleSaveProfile = async (payload: {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const response = await updateProfile(payload);
    updateStoredUserFullName(response.fullName);
    setUser((previous) => previous ? { ...previous, fullName: response.fullName } : previous);
  };

  if (!user) {
    return (
      <Routes>
        <Route
          path="/"
          element={(
            <main className="auth-layout">
              <h1>ToDo Management</h1>
              <p className="subtitle">Log in to manage your tasks.</p>
              <LoginForm
                onAuthenticated={setUser}
                onRegisterClick={() => navigate("/register")}
                onForgotPasswordClick={() => navigate("/forgot-password")}
              />
            </main>
          )}
        />
        <Route
          path="/register"
          element={(
            <main className="auth-layout">
              <h1>ToDo Management</h1>
              <p className="subtitle">Create your account.</p>
              <RegisterForm
                onAuthenticated={setUser}
                onBackToLoginClick={() => navigate("/")}
              />
            </main>
          )}
        />
        <Route
          path="/forgot-password"
          element={(
            <main className="auth-layout">
              <h1>ToDo Management</h1>
              <p className="subtitle">Request a password reset token.</p>
              <ForgotPasswordForm
                onRequestSucceeded={() => {
                  setCanResetPassword(true);
                  navigate("/reset-password");
                }}
              />
            </main>
          )}
        />
        <Route
          path="/reset-password"
          element={canResetPassword
            ? (
              <main className="auth-layout">
                <h1>ToDo Management</h1>
                <p className="subtitle">Set your new password.</p>
                <ResetPasswordForm />
              </main>
            )
            : <Navigate to="/forgot-password" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/tasks"
        element={(
          <main className="app-layout">
            <AppHeader
              title="Task Dashboard"
              fullName={user.fullName}
              onLogout={handleLogout}
              onProfileClick={() => navigate("/profile")}
              rightActions={(
                <button
                  type="button"
                  className="create-plus-button"
                  title="Create new task"
                  aria-label="Create new task"
                  onClick={() => navigate("/create-task")}
                >
                  +
                </button>
              )}
            />

            <label className="task-search">
              Search Tasks
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCompletedTasks(null);
                }}
                placeholder="Search title or description"
              />
            </label>

            {loadingOpenTasks && <p>Loading open tasks...</p>}
            {error && <p className="error">{error}</p>}
            {!loadingOpenTasks && (
              <TaskList
                tasks={openTasks}
                currentUser={user}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            )}

            <section className="completed-section">
              <button
                type="button"
                className="accordion-toggle"
                onClick={() => setIsCompletedExpanded((value) => !value)}
                aria-expanded={isCompletedExpanded}
              >
                Completed {isCompletedExpanded ? "▾" : "▸"}
              </button>

              {isCompletedExpanded && (
                <>
                  {loadingCompletedTasks && <p>Loading completed tasks...</p>}
                  {!loadingCompletedTasks && (
                    <TaskList
                      tasks={completedTasks ?? []}
                      currentUser={user}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  )}
                </>
              )}
            </section>
          </main>
        )}
      />
      <Route
        path="/create-task"
        element={(
          <main className="app-layout">
            <AppHeader
              title="Create Task"
              fullName={user.fullName}
              onLogout={handleLogout}
              onProfileClick={() => navigate("/profile")}
              onBack={() => navigate("/tasks")}
            />

            <TaskForm
              submitLabel="Create Task"
              onSubmit={handleCreate}
              minDueDate={toLocalDateInputValue(new Date())}
            />
          </main>
        )}
      />
      <Route
        path="/profile"
        element={(
          <main className="app-layout">
            <AppHeader
              title="Profile"
              fullName={user.fullName}
              onLogout={handleLogout}
              onProfileClick={() => navigate("/profile")}
              onBack={() => navigate("/tasks")}
            />

            <ProfileForm user={user} onSave={handleSaveProfile} />
          </main>
        )}
      />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
};

export default App;
