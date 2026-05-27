import type { Task } from 'src/types/Task';
import type {
    GetTasksParams,
    PagedResponse,
    PagedTaskResponse
} from 'src/types/ApiTasks';
import { apiClient } from 'src/services/auth.service';

const toDateOnlyString = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }

    return value.slice(0, 10);
};

const mapTask = (task: Task): Task => ({
    ...task,
    dueDate: toDateOnlyString(task.dueDate)
});

export const getTasks = async (
    params?: GetTasksParams
): Promise<PagedTaskResponse> => {
    const response = await apiClient.get<PagedResponse<Task>>('/tasks', {
        params: {
            search: params?.search?.trim() || undefined,
            status: params?.status ?? 'all',
            page: params?.page,
            pageSize: params?.pageSize,
            sort: params?.sort ?? 'recentlyAdded',
            sortDirection: params?.sortDirection ?? 'asc'
        }
    });
    return {
        ...response.data,
        items: response.data.items.map(mapTask)
    };
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', task);
    return mapTask(response.data);
};

export const updateTask = async (
    id: string,
    updates: Partial<Task>
): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, updates);
    return mapTask(response.data);
};

export const deleteTask = async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
};
