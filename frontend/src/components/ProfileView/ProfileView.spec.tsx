import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProfileView } from "src/components/ProfileView/ProfileView";

const updateProfileMock = vi.fn(async (payload: { fullName: string }) => ({
  id: "1",
  fullName: payload.fullName,
  email: "alice@todo.local",
}));

vi.mock("src/services/profile.service", () => ({
  updateProfile: (payload: { fullName: string }) => updateProfileMock(payload),
}));

describe("ProfileView", () => {
  it("saves profile and notifies parent callback", async () => {
    const user = userEvent.setup();
    const onFullNameUpdated = vi.fn();

    render(
      <MemoryRouter>
        <ProfileView
          currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
          onLogout={async () => {}}
          onFullNameUpdated={onFullNameUpdated}
        />
      </MemoryRouter>
    );

    const fullNameInput = screen.getByLabelText(/Full Name/i);
    await user.clear(fullNameInput);
    await user.type(fullNameInput, "Alice Updated");
    await user.click(screen.getByRole("button", { name: "Save Profile" }));

    expect(updateProfileMock).toHaveBeenCalled();
    expect(onFullNameUpdated).toHaveBeenCalledWith("Alice Updated");
  });

  it("navigates back to tasks when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={(
              <ProfileView
                currentUser={{ id: "1", fullName: "Alice", email: "alice@todo.local" }}
                onLogout={async () => {}}
                onFullNameUpdated={() => {}}
              />
            )}
          />
          <Route path="/tasks" element={<h1>Tasks Route</h1>} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { name: "Tasks Route" })).toBeInTheDocument();
  });
});
