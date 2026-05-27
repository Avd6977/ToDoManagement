import type { Task } from 'src/types/Task';

export type TaskStatusFilter = 'open' | 'completed' | 'overdue' | 'all';
export type TaskSortOption = 'recentlyAdded' | 'alphabetical' | 'dueDate';
export type SortDirection = 'asc' | 'desc';

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface PagedTaskResponse extends PagedResponse<Task> {}

export interface GetTasksParams {
    search?: string;
    status?: TaskStatusFilter;
    page?: number;
    pageSize?: number;
    sort?: TaskSortOption;
    sortDirection?: SortDirection;
}
