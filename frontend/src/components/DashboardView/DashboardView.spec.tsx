import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardView } from "src/components/DashboardView/DashboardView";

vi.mock("src/components/TaskList/TaskList", () => ({
  TaskList: () => <div>TaskList Mock</div>,
}));

describe("DashboardView", () => {
  it("renders dashboard and loads task list", async () => {
    render(
      <MemoryRouter>
        <DashboardView
          currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
          onLogout={async () => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Task Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort and Filter" })).toBeInTheDocument();
    expect(await screen.findByText("TaskList Mock")).toBeInTheDocument();
  });

  it("navigates to create route from controls", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <Routes>
          <Route
            path="/tasks"
            element={(
              <DashboardView
                currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
                onLogout={async () => {}}
              />
            )}
          />
          <Route path="/create-task" element={<h1>Create Route</h1>} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(await screen.findByRole("heading", { name: "Create Route" })).toBeInTheDocument();
  });
});
