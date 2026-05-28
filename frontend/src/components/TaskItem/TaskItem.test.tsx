import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskItem } from "src/components/TaskItem/TaskItem";
import type { Task } from "src/types/Task";
import type { User } from "src/types/User";

describe("TaskItem", () => {
  it("shows edit button for incomplete tasks", () => {
    const task: Task = {
      id: "task-edit-open",
      description: "Open task",
      dueDate: null,
      isCompleted: false,
    };

    const currentUser: User = {
      id: "user-1",
      fullName: "Alice User",
      email: "alice@todo.local",
    };

    render(
      <TaskItem
        task={task}
        currentUser={currentUser}
        onToggleComplete={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("hides edit button for completed tasks", () => {
    const task: Task = {
      id: "task-edit-completed",
      description: "Completed task",
      dueDate: null,
      isCompleted: true,
    };

    const currentUser: User = {
      id: "user-1",
      fullName: "Alice User",
      email: "alice@todo.local",
    };

    render(
      <TaskItem
        task={task}
        currentUser={currentUser}
        onToggleComplete={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("requires confirmation before deleting", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    const task: Task = {
      id: "task-1",
      description: "Task to delete",
      dueDate: null,
      isCompleted: false,
    };

    const currentUser: User = {
      id: "user-1",
      fullName: "Alice User",
      email: "alice@todo.local",
    };

    // ARRANGE
    render(
      <TaskItem
        task={task}
        currentUser={currentUser}
        onToggleComplete={vi.fn().mockResolvedValue(undefined)}
        onDelete={onDelete}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // ACT
    await user.click(screen.getByRole("button", { name: "Delete" }));

    // ASSERT
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete this task?")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    // ACT
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // ASSERT
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    // ACT
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const modal = screen.getByRole("dialog");
    await user.click(within(modal).getByRole("button", { name: "Delete" }));

    // ASSERT
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });

  it("does not show overdue state for completed tasks", () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const pastDueDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const task: Task = {
      id: "task-2",
      description: "Completed task",
      dueDate: pastDueDate,
      isCompleted: true,
    };

    const currentUser: User = {
      id: "user-1",
      fullName: "Alice User",
      email: "alice@todo.local",
    };

    render(
      <TaskItem
        task={task}
        currentUser={currentUser}
        onToggleComplete={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByLabelText("Overdue")).not.toBeInTheDocument();
  });

  it("renders completion icon to the left of title and fills when completed", async () => {
    const user = userEvent.setup();
    const onToggleComplete = vi.fn().mockResolvedValue(undefined);

    const task: Task = {
      id: "task-3",
      description: "Task icon check",
      dueDate: null,
      isCompleted: false,
    };

    const currentUser: User = {
      id: "user-1",
      fullName: "Alice User",
      email: "alice@todo.local",
    };

    const { container, rerender } = render(
      <TaskItem
        task={task}
        currentUser={currentUser}
        onToggleComplete={onToggleComplete}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const statusButton = screen.getByRole("button", { name: "Mark Complete" });
    const titleText = screen.getByText("Task icon check");

    expect(statusButton).toHaveClass("task-status-toggle");
    expect(statusButton.className.includes("completed")).toBe(false);
    expect(container.querySelector(".task-status-check")).toBeNull();
    expect(titleText.compareDocumentPosition(statusButton) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();

    await user.click(statusButton);
    expect(onToggleComplete).toHaveBeenCalledTimes(1);

    rerender(
      <TaskItem
        task={{ ...task, isCompleted: true }}
        currentUser={currentUser}
        onToggleComplete={onToggleComplete}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const completedButton = screen.getByRole("button", { name: "Mark Incomplete" });
    expect(completedButton.className.includes("completed")).toBe(true);
    expect(container.querySelector(".task-status-check")).toBeTruthy();
  });
});
