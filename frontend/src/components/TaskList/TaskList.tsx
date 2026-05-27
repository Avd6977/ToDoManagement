import { useEffect, useState } from "react";
import type { Task } from "src/types/Task";
import type { User } from "src/types/User";
import { TaskItem } from "src/components/TaskItem/TaskItem";
import {
  deleteTask,
  getTasks,
  updateTask,
} from "src/services/task.service";
import type {
  SortDirection,
  TaskSortOption,
  TaskStatusFilter,
} from "src/types/ApiTasks";

interface TaskListProps {
  currentUser: User;
  searchTerm: string;
  sortOption: TaskSortOption;
  sortDirection: SortDirection;
  overdueOnly: boolean;
  pageSize: number;
  queryVersion: number;
}

export const TaskList = ({
  currentUser,
  searchTerm,
  sortOption,
  sortDirection,
  overdueOnly,
  pageSize,
  queryVersion,
}: TaskListProps): JSX.Element => {
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[] | null>(null);
  const [loadingOpenTasks, setLoadingOpenTasks] = useState(false);
  const [loadingCompletedTasks, setLoadingCompletedTasks] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [openTasksPage, setOpenTasksPage] = useState(1);
  const [openTasksTotalPages, setOpenTasksTotalPages] = useState(0);
  const [completedTasksPage, setCompletedTasksPage] = useState(1);
  const [completedTasksTotalPages, setCompletedTasksTotalPages] = useState(0);

  const loadTasks = async (
    status: TaskStatusFilter,
    options?: { force?: boolean; page?: number }
  ) => {
    try {
      if (status === "completed") {
        if (completedTasks != null && !options?.force) {
          return;
        }

        setLoadingCompletedTasks(true);
      } else {
        setLoadingOpenTasks(true);
      }

      if (status === "completed" && overdueOnly) {
        setCompletedTasks([]);
        setCompletedTasksTotalPages(0);
        return;
      }

      const requestedStatus: TaskStatusFilter =
        status === "open" && overdueOnly ? "overdue" : status;

      const requestedPage =
        options?.page ?? (status === "completed" ? completedTasksPage : openTasksPage);

      const fetchedTasks = await getTasks({
        search: searchTerm,
        status: requestedStatus,
        page: requestedPage,
        pageSize,
        sort: sortOption,
        sortDirection,
      });

      if (status === "completed") {
        setCompletedTasks(fetchedTasks.items);
        setCompletedTasksTotalPages(fetchedTasks.totalPages);
      } else {
        setOpenTasks(fetchedTasks.items);
        setOpenTasksTotalPages(fetchedTasks.totalPages);
      }
    } catch {
    } finally {
      if (status === "completed") {
        setLoadingCompletedTasks(false);
      } else {
        setLoadingOpenTasks(false);
      }
    }
  };

  useEffect(() => {
    setOpenTasksPage(1);
    setCompletedTasksPage(1);
    setCompletedTasks(null);
  }, [queryVersion]);

  useEffect(() => {
    void loadTasks("open", { force: true, page: openTasksPage });
  }, [
    currentUser,
    openTasksPage,
    searchTerm,
    sortOption,
    sortDirection,
    overdueOnly,
    pageSize,
    queryVersion,
  ]);

  useEffect(() => {
    if (isCompletedExpanded) {
      void loadTasks("completed", { force: true, page: completedTasksPage });
    }
  }, [
    isCompletedExpanded,
    currentUser,
    completedTasksPage,
    searchTerm,
    sortOption,
    sortDirection,
    overdueOnly,
    pageSize,
    queryVersion,
  ]);

  const handleUpdate = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    await loadTasks("open", { force: true, page: openTasksPage });
    if (completedTasks != null) {
      await loadTasks("completed", { force: true, page: completedTasksPage });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!task.isCompleted) {
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
    if (completedTasks != null) {
      await loadTasks("completed", { force: true, page: completedTasksPage });
    }
  };

  return (
    <>
      {loadingOpenTasks && <p>Loading open tasks...</p>}
      {!loadingOpenTasks && !openTasks.length && <p>No tasks yet.</p>}
      {!loadingOpenTasks && openTasks.length > 0 && (
        <ul className="task-list">
          {openTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              currentUser={currentUser}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </ul>
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
              {!loadingCompletedTasks && !(completedTasks ?? []).length && <p>No tasks yet.</p>}
              {!loadingCompletedTasks && (completedTasks ?? []).length > 0 && (
                <ul className="task-list">
                  {(completedTasks ?? []).map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </ul>
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
    </>
  );
};
