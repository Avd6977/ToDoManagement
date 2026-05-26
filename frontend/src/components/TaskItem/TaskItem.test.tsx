import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskItem } from "./TaskItem";
import type { Task } from "../../types/Task";
import type { User } from "../../types/User";

describe("TaskItem", () => {
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
    const pastDueDate = new Date(Date.now() - 86_400_000).toISOString();

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
});
