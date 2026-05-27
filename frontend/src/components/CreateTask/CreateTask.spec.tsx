import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CreateTask } from "src/components/CreateTask/CreateTask";

const createTaskMock = vi.fn(async () => ({
  id: "created",
  description: "Created",
  dueDate: null,
  isCompleted: false,
}));

vi.mock("src/services/task.service", () => ({
  createTask: (task: unknown) => createTaskMock(task),
}));

describe("CreateTask", () => {
  it("submits create and navigates to tasks route", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/create-task"]}>
        <Routes>
          <Route
            path="/create-task"
            element={(
              <CreateTask
                currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
                onLogout={async () => {}}
              />
            )}
          />
          <Route path="/tasks" element={<h1>Tasks Route</h1>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/Description/i), "My new task");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(createTaskMock).toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Tasks Route" })).toBeInTheDocument();
  });
});
