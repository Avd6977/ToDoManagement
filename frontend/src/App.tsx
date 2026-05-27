import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm/LoginForm";
import { RegisterForm } from "./components/RegisterForm/RegisterForm";
import { TaskForm } from "./components/TaskForm/TaskForm";
import { TaskList } from "./components/TaskList/TaskList";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { ProfileForm } from "./components/ProfileForm/ProfileForm";
import { Toaster } from "./components/Toaster/Toaster";
import {
  createTask,
  deleteTask,
  getStoredUser,
  getTasks,
  logout,
  type SortDirection,
  type TaskSortOption,
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

const DEFAULT_TASK_PAGE_SIZE = 25;
const DEFAULT_SORT_OPTION: TaskSortOption = "recentlyAdded";
const DEFAULT_SORT_DIRECTION: SortDirection = "asc";
const DEFAULT_OVERDUE_ONLY = false;

const App = (): JSX.Element => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[] | null>(null);
  const [loadingOpenTasks, setLoadingOpenTasks] = useState(false);
  const [loadingCompletedTasks, setLoadingCompletedTasks] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openTasksPage, setOpenTasksPage] = useState(1);
  const [openTasksTotalPages, setOpenTasksTotalPages] = useState(0);
  const [completedTasksPage, setCompletedTasksPage] = useState(1);
  const [completedTasksTotalPages, setCompletedTasksTotalPages] = useState(0);
  const [taskQueryVersion, setTaskQueryVersion] = useState(0);
  const [sortOption, setSortOption] = useState<TaskSortOption>(DEFAULT_SORT_OPTION);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION);
  const [taskPageSize, setTaskPageSize] = useState(DEFAULT_TASK_PAGE_SIZE);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const appliedFilterCount = Number(sortOption !== DEFAULT_SORT_OPTION)
    + Number(sortDirection !== DEFAULT_SORT_DIRECTION)
    + Number(overdueOnly !== DEFAULT_OVERDUE_ONLY);

  const loadTasks = async (status: TaskStatusFilter, options?: { force?: boolean; page?: number }) => {
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

      if (status === "completed" && overdueOnly) {
        setCompletedTasks([]);
        setCompletedTasksTotalPages(0);
        return;
      }

      const requestedStatus: TaskStatusFilter =
        status === "open" && overdueOnly ? "overdue" : status;

      const requestedPage = options?.page ?? (status === "completed" ? completedTasksPage : openTasksPage);
      const fetchedTasks = await getTasks({
        search: searchTerm,
        status: requestedStatus,
        page: requestedPage,
        pageSize: taskPageSize,
        sort: sortOption,
        sortDirection,
      });
      if (status == "completed")
      {
        setCompletedTasks(fetchedTasks.items);
        setCompletedTasksTotalPages(fetchedTasks.totalPages);
      }
      else
      {
        setOpenTasks(fetchedTasks.items);
        setOpenTasksTotalPages(fetchedTasks.totalPages);
      }
    } catch {
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
    void loadTasks("open", { force: true, page: openTasksPage });
  }, [user, openTasksPage, taskQueryVersion]);

  const handleSortSelect = (nextSort: TaskSortOption) => {
    if (nextSort === sortOption) {
      return;
    }
    setSortOption(nextSort);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setOpenTasksPage(1);
    setCompletedTasksPage(1);
    setTaskQueryVersion((previous) => previous + 1);
    setCompletedTasks(null);
    setIsSortMenuOpen(false);
  };

  const handleSortDirectionSelect = (nextDirection: SortDirection) => {
    setSortDirection(nextDirection);
    setOpenTasksPage(1);
    setCompletedTasksPage(1);
    setTaskQueryVersion((previous) => previous + 1);
    setCompletedTasks(null);
    setIsSortMenuOpen(false);
  };

  const handleResetFilters = () => {
    if (
      sortOption === DEFAULT_SORT_OPTION
      && sortDirection === DEFAULT_SORT_DIRECTION
      && overdueOnly === DEFAULT_OVERDUE_ONLY
    ) {
      setIsSortMenuOpen(false);
      return;
    }

    setSortOption(DEFAULT_SORT_OPTION);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setOverdueOnly(DEFAULT_OVERDUE_ONLY);
    setOpenTasksPage(1);
    setCompletedTasksPage(1);
    setTaskQueryVersion((previous) => previous + 1);
    setCompletedTasks(null);
    setIsSortMenuOpen(false);
  };

  useEffect(() => {
    if (isCompletedExpanded)
    {
      void loadTasks("completed", { force: true, page: completedTasksPage });
    }
  }, [isCompletedExpanded, user, completedTasksPage, taskQueryVersion]);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!isSortMenuOpen) {
        return;
      }

      if (sortMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsSortMenuOpen(false);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isSortMenuOpen]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setOpenTasks([]);
      setCompletedTasks(null);
      setOpenTasksPage(1);
      setCompletedTasksPage(1);
      setOpenTasksTotalPages(0);
      setCompletedTasksTotalPages(0);
      setTaskQueryVersion((previous) => previous + 1);
      setIsCompletedExpanded(false);
      setSearchTerm("");
      setOverdueOnly(DEFAULT_OVERDUE_ONLY);
      setIsSortMenuOpen(false);
      setTaskPageSize(DEFAULT_TASK_PAGE_SIZE);
      navigate("/");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  const handleCreate = async (task: Partial<Task>) => {
    await createTask(task);
    setOpenTasksPage(1);
    await loadTasks("open", { force: true, page: 1 });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true, page: completedTasksPage });
    }
    navigate("/tasks");
  };

  const handleUpdate = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    await loadTasks("open", { force: true, page: openTasksPage });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true, page: completedTasksPage });
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
    await loadTasks("open", { force: true, page: openTasksPage });
    if (completedTasks != null)
    {
      await loadTasks("completed", { force: true, page: completedTasksPage });
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setOpenTasks([]);
    setCompletedTasks(null);
    setOpenTasksPage(1);
    setCompletedTasksPage(1);
    setOpenTasksTotalPages(0);
    setCompletedTasksTotalPages(0);
    setIsCompletedExpanded(false);
    setSearchTerm("");
    setTaskPageSize(DEFAULT_TASK_PAGE_SIZE);
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
      <>
        <Toaster />
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
                  onCancel={() => navigate("/")}
                />
              </main>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster />
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
            />

            <div className="task-toolbar">
              <label className="task-search">
                Search Tasks
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setOpenTasksPage(1);
                    setCompletedTasksPage(1);
                    setTaskQueryVersion((previous) => previous + 1);
                    setCompletedTasks(null);
                  }}
                  placeholder="Search description"
                />
              </label>

              <button
                type="button"
                className="create-plus-button"
                title="Create Task"
                aria-label="Create Task"
                onClick={() => navigate("/create-task")}
              >
                Create Task +
              </button>

              <div className="sort-menu-wrapper sort-menu-right" ref={sortMenuRef}>
                <button
                  type="button"
                  className={`sort-icon-button secondary ${appliedFilterCount > 0 ? "active-filter" : ""}`}
                  title="Sort and Filter"
                  aria-label="Sort and Filter"
                  onClick={() => setIsSortMenuOpen((previous) => !previous)}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    focusable="false"
                  >
                    <path
                      d="M3 6h18l-7 8v5l-4 2v-7L3 6z"
                      fill="currentColor"
                    />
                  </svg>
                  {appliedFilterCount > 0 && (
                    <span className="filter-count-bubble" aria-label={`${appliedFilterCount} applied filters`}>
                      {appliedFilterCount}
                    </span>
                  )}
                </button>

                {isSortMenuOpen && (
                  <div className="sort-menu" role="menu" aria-label="Sort and Filter options">
                    <p className="sort-menu-title">Sort By</p>
                    <div className="actions">
                      <button
                        type="button"
                        className={sortOption === "recentlyAdded" ? "" : "secondary"}
                        onClick={() => handleSortSelect("recentlyAdded")}
                      >
                        Recently Added
                      </button>
                      <button
                        type="button"
                        className={sortOption === "alphabetical" ? "" : "secondary"}
                        onClick={() => handleSortSelect("alphabetical")}
                      >
                        Alphabetical
                      </button>
                      <button
                        type="button"
                        className={sortOption === "dueDate" ? "" : "secondary"}
                        onClick={() => handleSortSelect("dueDate")}
                      >
                        Due Date
                      </button>
                    </div>

                    <p className="sort-menu-title">Direction</p>
                    <div className="actions">
                      <button
                        type="button"
                        className={sortDirection === "asc" ? "" : "secondary"}
                        onClick={() => handleSortDirectionSelect("asc")}
                      >
                        Ascending
                      </button>
                      <button
                        type="button"
                        className={sortDirection === "desc" ? "" : "secondary"}
                        onClick={() => handleSortDirectionSelect("desc")}
                      >
                        Descending
                      </button>
                    </div>

                    <p className="sort-menu-title">Filters</p>
                    <div className="actions">
                      <button
                        type="button"
                        className={overdueOnly ? "" : "secondary"}
                        onClick={() => {
                          setOverdueOnly((previous) => !previous);
                          setOpenTasksPage(1);
                          setCompletedTasksPage(1);
                          setTaskQueryVersion((previous) => previous + 1);
                          setCompletedTasks(null);
                          setIsSortMenuOpen(false);
                        }}
                      >
                        Overdue Only
                      </button>
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleResetFilters}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="page-size-control">
                Page Size
                <select
                  aria-label="Page Size"
                  value={taskPageSize}
                  onChange={(event) => {
                    const nextPageSize = Number(event.target.value);
                    setTaskPageSize(nextPageSize);
                    setOpenTasksPage(1);
                    setCompletedTasksPage(1);
                    setTaskQueryVersion((previous) => previous + 1);
                    setCompletedTasks(null);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            {loadingOpenTasks && <p>Loading open tasks...</p>}
            {!loadingOpenTasks && (
              <TaskList
                tasks={openTasks}
                currentUser={user}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            )}
            {!loadingOpenTasks && openTasksTotalPages > 1 && (
              <div className="pagination-bar" role="navigation" aria-label="In Progress pagination">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpenTasksPage((previous) => Math.max(1, previous - 1))}
                  disabled={openTasksPage <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {openTasksPage} of {openTasksTotalPages}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpenTasksPage((previous) => Math.min(openTasksTotalPages, previous + 1))}
                  disabled={openTasksPage >= openTasksTotalPages}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpenTasksPage(openTasksTotalPages)}
                  disabled={openTasksPage >= openTasksTotalPages}
                >
                  Last Page
                </button>
              </div>
            )}

            {!overdueOnly && (
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
                  {!loadingCompletedTasks && completedTasksTotalPages > 1 && (
                    <div className="pagination-bar" role="navigation" aria-label="Completed pagination">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setCompletedTasksPage((previous) => Math.max(1, previous - 1))}
                        disabled={completedTasksPage <= 1}
                      >
                        Previous
                      </button>
                      <span>
                        Page {completedTasksPage} of {completedTasksTotalPages}
                      </span>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setCompletedTasksPage((previous) => Math.min(completedTasksTotalPages, previous + 1))}
                        disabled={completedTasksPage >= completedTasksTotalPages}
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setCompletedTasksPage(completedTasksTotalPages)}
                        disabled={completedTasksPage >= completedTasksTotalPages}
                      >
                        Last Page
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
            )}
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
              onCancel={() => navigate("/tasks")}
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

            <ProfileForm
              user={user}
              onSave={handleSaveProfile}
              onCancel={() => navigate("/tasks")}
            />
            </main>
          )}
        />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </>
  );
};

export default App;
