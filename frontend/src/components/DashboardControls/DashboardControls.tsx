import { useEffect, useRef, useState } from "react";
import type { SortDirection, TaskSortOption } from "src/types/ApiTasks";

interface DashboardControlsProps {
  searchTerm: string;
  sortOption: TaskSortOption;
  sortDirection: SortDirection;
  overdueOnly: boolean;
  pageSize: number;
  appliedFilterCount: number;
  onSearchTermChange: (value: string) => void;
  onCreateClick: () => void;
  onSortSelect: (value: TaskSortOption) => void;
  onSortDirectionSelect: (value: SortDirection) => void;
  onToggleOverdueOnly: () => void;
  onResetFilters: () => void;
  onPageSizeChange: (value: number) => void;
}

export const DashboardControls = ({
  searchTerm,
  sortOption,
  sortDirection,
  overdueOnly,
  pageSize,
  appliedFilterCount,
  onSearchTermChange,
  onCreateClick,
  onSortSelect,
  onSortDirectionSelect,
  onToggleOverdueOnly,
  onResetFilters,
  onPageSizeChange,
}: DashboardControlsProps): JSX.Element => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

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

  const ascendingDirectionLabel = sortOption === "recentlyAdded" ? "Oldest" : "Ascending";
  const descendingDirectionLabel = sortOption === "recentlyAdded" ? "Newest" : "Descending";

  return (
    <div className="task-toolbar">
      <label className="task-search">
        Search Tasks
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search description"
        />
      </label>

      <button
        type="button"
        className="create-plus-button"
        title="Create Task"
        aria-label="Create Task"
        onClick={onCreateClick}
      >
        Create Task +
      </button>

      <div className="toolbar-secondary-controls">
        <div className="sort-menu-wrapper" ref={sortMenuRef}>
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
                  onClick={() => {
                    onSortSelect("recentlyAdded");
                    setIsSortMenuOpen(false);
                  }}
                >
                  Recently Added
                </button>
                <button
                  type="button"
                  className={sortOption === "alphabetical" ? "" : "secondary"}
                  onClick={() => {
                    onSortSelect("alphabetical");
                    setIsSortMenuOpen(false);
                  }}
                >
                  Alphabetical
                </button>
                <button
                  type="button"
                  className={sortOption === "dueDate" ? "" : "secondary"}
                  onClick={() => {
                    onSortSelect("dueDate");
                    setIsSortMenuOpen(false);
                  }}
                >
                  Due Date
                </button>
              </div>

              <p className="sort-menu-title">Direction</p>
              <div className="actions">
                <button
                  type="button"
                  className={sortDirection === "asc" ? "" : "secondary"}
                  onClick={() => {
                    onSortDirectionSelect("asc");
                    setIsSortMenuOpen(false);
                  }}
                >
                  {ascendingDirectionLabel}
                </button>
                <button
                  type="button"
                  className={sortDirection === "desc" ? "" : "secondary"}
                  onClick={() => {
                    onSortDirectionSelect("desc");
                    setIsSortMenuOpen(false);
                  }}
                >
                  {descendingDirectionLabel}
                </button>
              </div>

              <p className="sort-menu-title">Filters</p>
              <div className="actions">
                <button
                  type="button"
                  className={overdueOnly ? "" : "secondary"}
                  onClick={() => {
                    onToggleOverdueOnly();
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
                  onClick={() => {
                    onResetFilters();
                    setIsSortMenuOpen(false);
                  }}
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
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>
    </div>
  );
};
