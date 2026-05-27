import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardControls } from "src/components/DashboardControls/DashboardControls";

const renderControls = (overrides?: Partial<React.ComponentProps<typeof DashboardControls>>) => {
  const props: React.ComponentProps<typeof DashboardControls> = {
    searchTerm: "",
    sortOption: "recentlyAdded",
    sortDirection: "asc",
    overdueOnly: false,
    pageSize: 25,
    appliedFilterCount: 0,
    onSearchTermChange: vi.fn(),
    onCreateClick: vi.fn(),
    onSortSelect: vi.fn(),
    onSortDirectionSelect: vi.fn(),
    onToggleOverdueOnly: vi.fn(),
    onResetFilters: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };

  render(
    <>
      <h1>Outside Element</h1>
      <DashboardControls {...props} />
    </>
  );

  return props;
};

describe("DashboardControls", () => {
  it("opens sort menu and triggers sort/direction callbacks", async () => {
    const user = userEvent.setup();
    const props = renderControls();

    await user.click(screen.getByRole("button", { name: "Sort and Filter" }));
    await user.click(screen.getByRole("button", { name: "Due Date" }));

    expect(props.onSortSelect).toHaveBeenCalledWith("dueDate");
    expect(screen.queryByRole("menu", { name: "Sort and Filter options" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sort and Filter" }));
    await user.click(screen.getByRole("button", { name: "Newest" }));

    expect(props.onSortDirectionSelect).toHaveBeenCalledWith("desc");
    expect(screen.queryByRole("menu", { name: "Sort and Filter options" })).not.toBeInTheDocument();
  });

  it("closes sort menu when clicking outside", async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole("button", { name: "Sort and Filter" }));
    expect(screen.getByRole("menu", { name: "Sort and Filter options" })).toBeInTheDocument();

    await user.click(screen.getByRole("heading", { name: "Outside Element" }));

    expect(screen.queryByRole("menu", { name: "Sort and Filter options" })).not.toBeInTheDocument();
  });

  it("shows active filter state and counter bubble", () => {
    renderControls({
      sortOption: "dueDate",
      appliedFilterCount: 1,
    });

    const filterButton = screen.getByRole("button", { name: "Sort and Filter" });
    expect(filterButton.className.includes("active-filter")).toBe(true);
    expect(screen.getByLabelText("1 applied filters")).toBeInTheDocument();
  });

  it("resets filters from menu", async () => {
    const user = userEvent.setup();
    const props = renderControls({ appliedFilterCount: 2 });

    await user.click(screen.getByRole("button", { name: "Sort and Filter" }));
    await user.click(screen.getByRole("button", { name: "Reset Filters" }));

    expect(props.onResetFilters).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu", { name: "Sort and Filter options" })).not.toBeInTheDocument();
  });
});
