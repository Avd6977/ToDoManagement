import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskList } from "src/components/TaskList/TaskList";

const getTasksMock = vi.fn(async ({ status }: { status?: string }) => {
  if (status === "completed") {
    return {
      items: [
        {
          id: "completed-1",
          description: "Completed Task",
          dueDate: "2026-06-01",
          isCompleted: true,
        },
      ],
      page: 1,
      pageSize: 25,
      totalCount: 26,
      totalPages: 2,
    };
  }

  return {
    items: [
      {
        id: "open-1",
        description: "Open Task",
        dueDate: null,
        isCompleted: false,
      },
    ],
    page: 1,
    pageSize: 25,
    totalCount: 26,
    totalPages: 2,
  };
});

vi.mock("src/services/task.service", () => ({
  getTasks: (params: unknown) => getTasksMock(params as { status?: string }),
  updateTask: vi.fn(async () => undefined),
  deleteTask: vi.fn(async () => undefined),
}));

describe("TaskList", () => {
  it("loads open tasks and allows expanding completed section", async () => {
    const user = userEvent.setup();

    render(
      <TaskList
        currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
        searchTerm=""
        sortOption="recentlyAdded"
        sortDirection="desc"
        overdueOnly={false}
        pageSize={25}
        queryVersion={0}
      />
    );

    expect(await screen.findByText("Open Task")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "In Progress pagination" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Completed/i }));

    expect(await screen.findByRole("navigation", { name: "Completed pagination" })).toBeInTheDocument();
  });

  it("hides completed section when overdueOnly is enabled", async () => {
    render(
      <TaskList
        currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
        searchTerm=""
        sortOption="recentlyAdded"
        sortDirection="desc"
        overdueOnly
        pageSize={25}
        queryVersion={0}
      />
    );

    await screen.findByText("Open Task");
    expect(screen.queryByRole("button", { name: /Completed/i })).not.toBeInTheDocument();
  });
});
