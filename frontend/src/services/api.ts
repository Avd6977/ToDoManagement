import axios from 'axios';
import type { Task } from '../types/Task';
import type { User, UserOption } from '../types/User';

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'todo_jwt';
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

interface AuthResponse {
    id: string;
    username: string;
    token: string;
}

const persistAuth = (auth: AuthResponse): User => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({ id: auth.id, username: auth.username })
    );
    return { id: auth.id, username: auth.username, token: auth.token };
};

export const register = async (
    username: string,
    password: string
): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
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

export const getTasks = async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks');
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

export const searchUsers = async (query: string): Promise<UserOption[]> => {
    const response = await apiClient.get<UserOption[]>('/users/search', {
        params: { query }
    });
    return response.data;
};

export const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (!rawUser || !token) {
        return null;
    }

    try {
        const user = JSON.parse(rawUser) as User;
        return { ...user, token };
    } catch {
        return null;
    }
};
