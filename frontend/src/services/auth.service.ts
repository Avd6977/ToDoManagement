import axios from 'axios';
import type { User } from 'src/types/User';
import type { ApiProfileResponse, AuthResponse } from 'src/types/ApiAuth';
import {
    getApiErrorMessage,
    toasterMessageService
} from 'src/services/toasterMessageService';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL =
    configuredApiBaseUrl && configuredApiBaseUrl.length > 0
        ? configuredApiBaseUrl.replace(/\/$/, '')
        : 'http://localhost:5000/api';

const sendLogoutRequest = async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/auth/logout`, undefined, {
        withCredentials: true
    });
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        let didDispatchUnauthorized = false;
        const dispatchUnauthorized = (): void => {
            if (didDispatchUnauthorized) {
                return;
            }

            didDispatchUnauthorized = true;
            window.dispatchEvent(new Event('auth:unauthorized'));
        };

        if (!axios.isAxiosError(error)) {
            toasterMessageService.showError(
                'Request failed. Please try again.'
            );
            return Promise.reject(error);
        }

        const statusCode = error.response?.status;
        const requestUrl = error.config?.url ?? '';
        const isSessionRequest = requestUrl.includes('/auth/session');
        const isAuthLifecycleRequest = [
            '/auth/login',
            '/auth/register',
            '/auth/refresh',
            '/auth/session',
            '/auth/logout',
            '/auth/revoke'
        ].some((path) => requestUrl.includes(path));

        const originalRequest = error.config as typeof error.config & {
            _retry?: boolean;
        };

        if (
            statusCode === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthLifecycleRequest
        ) {
            originalRequest._retry = true;

            try {
                await apiClient.post('/auth/refresh');
                return apiClient(originalRequest);
            } catch {
                try {
                    await sendLogoutRequest();
                } catch {
                    // Ignore logout failures; local state reset still occurs.
                }
                dispatchUnauthorized();
            }
        }

        if (!(isSessionRequest && statusCode === 401)) {
            toasterMessageService.showError(
                getApiErrorMessage(error, 'Request failed. Please try again.')
            );
        }

        if (statusCode === 401 && !isSessionRequest) {
            dispatchUnauthorized();
        }

        return Promise.reject(error);
    }
);

const mapApiUser = (auth: AuthResponse): User => {
    return {
        id: auth.id,
        fullName: auth.fullName,
        email: auth.username
    };
};

export const register = async (
    fullName: string,
    email: string,
    password: string
): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
        fullName,
        username: email,
        password
    });
    return mapApiUser(response.data);
};

export const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
        username: email,
        password
    });
    return mapApiUser(response.data);
};

export const refresh = async (): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    return mapApiUser(response.data);
};

export const revoke = async (): Promise<void> => {
    await apiClient.post('/auth/revoke');
};

export const getSession = async (): Promise<User | null> => {
    try {
        const response =
            await apiClient.get<ApiProfileResponse>('/auth/session');
        return {
            id: response.data.id,
            fullName: response.data.fullName,
            email: response.data.username
        };
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
        }

        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await sendLogoutRequest();
    } catch {
        // No-op. Local UI state will still be reset.
    }
};
