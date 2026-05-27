import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "src/components/AppHeader/AppHeader";
import { DashboardControls } from "src/components/DashboardControls/DashboardControls";
import { TaskList } from "src/components/TaskList/TaskList";
import type { SortDirection, TaskSortOption } from "src/types/ApiTasks";
import type { User } from "src/types/User";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_OPTION: TaskSortOption = "recentlyAdded";
const DEFAULT_SORT_DIRECTION: SortDirection = "desc";
const DEFAULT_OVERDUE_ONLY = false;

interface DashboardViewProps {
  currentUser: User;
  onLogout: () => Promise<void>;
}

export const DashboardView = ({
  currentUser,
  onLogout,
}: DashboardViewProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [queryVersion, setQueryVersion] = useState(0);
  const [sortOption, setSortOption] = useState<TaskSortOption>(DEFAULT_SORT_OPTION);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTION);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [overdueOnly, setOverdueOnly] = useState(DEFAULT_OVERDUE_ONLY);
  const navigate = useNavigate();

  const appliedFilterCount = Number(sortOption !== DEFAULT_SORT_OPTION)
    + Number(sortDirection !== DEFAULT_SORT_DIRECTION)
    + Number(overdueOnly !== DEFAULT_OVERDUE_ONLY);

  const handleSortSelect = (nextSort: TaskSortOption) => {
    if (nextSort === sortOption) {
      return;
    }

    setSortOption(nextSort);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setQueryVersion((previous) => previous + 1);
  };

  const handleSortDirectionSelect = (nextDirection: SortDirection) => {
    setSortDirection(nextDirection);
    setQueryVersion((previous) => previous + 1);
  };

  const handleResetFilters = () => {
    if (
      sortOption === DEFAULT_SORT_OPTION
      && sortDirection === DEFAULT_SORT_DIRECTION
      && overdueOnly === DEFAULT_OVERDUE_ONLY
    ) {
      return;
    }

    setSortOption(DEFAULT_SORT_OPTION);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setOverdueOnly(DEFAULT_OVERDUE_ONLY);
    setQueryVersion((previous) => previous + 1);
  };

  return (
    <main className="app-layout">
      <AppHeader
        title="Task Dashboard"
        fullName={currentUser.fullName}
        onLogout={onLogout}
        onProfileClick={() => navigate("/profile")}
      />

      <DashboardControls
        searchTerm={searchTerm}
        sortOption={sortOption}
        sortDirection={sortDirection}
        overdueOnly={overdueOnly}
        pageSize={pageSize}
        appliedFilterCount={appliedFilterCount}
        onSearchTermChange={(value) => {
          setSearchTerm(value);
          setQueryVersion((previous) => previous + 1);
        }}
        onCreateClick={() => navigate("/create-task")}
        onSortSelect={handleSortSelect}
        onSortDirectionSelect={handleSortDirectionSelect}
        onToggleOverdueOnly={() => {
          setOverdueOnly((previous) => !previous);
          setQueryVersion((previous) => previous + 1);
        }}
        onResetFilters={handleResetFilters}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setQueryVersion((previous) => previous + 1);
        }}
      />

      <TaskList
        currentUser={currentUser}
        searchTerm={searchTerm}
        sortOption={sortOption}
        sortDirection={sortDirection}
        overdueOnly={overdueOnly}
        pageSize={pageSize}
        queryVersion={queryVersion}
      />
    </main>
  );
};
