import axios from 'axios';
import type { Task } from '../types/Task';
import type { User } from '../types/User';

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'todo_jwt';
const REFRESH_TOKEN_KEY = 'todo_refresh_token';
const USER_KEY = 'todo_user';

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            logout();
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

interface AuthResponse {
    id: string;
    fullName: string;
    username: string;
    token: string;
    refreshToken: string;
}

interface ForgotPasswordResponse {
    message: string;
    resetToken?: string;
}

interface ProfileResponse {
    id: string;
    fullName: string;
    username: string;
}

export type TaskStatusFilter = 'open' | 'completed' | 'all';

interface GetTasksParams {
    search?: string;
    status?: TaskStatusFilter;
}

interface UpdateProfilePayload {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
}

const persistAuth = (auth: AuthResponse): User => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            id: auth.id,
            fullName: auth.fullName,
            username: auth.username
        })
    );
    return {
        id: auth.id,
        fullName: auth.fullName,
        username: auth.username,
        token: auth.token,
        refreshToken: auth.refreshToken
    };
};

export const register = async (
    fullName: string,
    username: string,
    password: string
): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
        fullName,
        username,
        password
    });
    return persistAuth(response.data);
};

export const login = async (
    username: string,
    password: string
): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
        username,
        password
    });
    return persistAuth(response.data);
};

export const refresh = async (refreshToken: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken
    });
    return persistAuth(response.data);
};

export const revoke = async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/revoke', { refreshToken });
};

export const forgotPassword = async (
    username: string
): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>(
        '/auth/forgot-password',
        {
            username
        }
    );
    return response.data;
};

export const resetPassword = async (
    resetToken: string,
    newPassword: string
): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword
    });
};

export const updateProfile = async (
    payload: UpdateProfilePayload
): Promise<ProfileResponse> => {
    const response = await apiClient.put<ProfileResponse>(
        '/auth/profile',
        payload
    );
    return response.data;
};

export const getTasks = async (params?: GetTasksParams): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks', {
        params: {
            search: params?.search?.trim() || undefined,
            status: params?.status ?? 'all'
        }
    });
    return response.data;
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', task);
    return response.data;
};

export const updateTask = async (
    id: string,
    updates: Partial<Task>
): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, updates);
    return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
};

export const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!rawUser || !token || !refreshToken) {
        return null;
    }

    try {
        const user = JSON.parse(rawUser) as User;
        return { ...user, token, refreshToken };
    } catch {
        return null;
    }
};

export const updateStoredUserFullName = (fullName: string): void => {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
        return;
    }

    try {
        const user = JSON.parse(rawUser) as User;
        localStorage.setItem(
            USER_KEY,
            JSON.stringify({
                ...user,
                fullName
            })
        );
    } catch {
        // Ignore malformed local user cache.
    }
};
