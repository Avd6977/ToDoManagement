export interface AuthResponse {
    id: string;
    fullName: string;
    username: string;
}

export interface ApiProfileResponse {
    id: string;
    fullName: string;
    username: string;
}

export interface ProfileResponse {
    id: string;
    fullName: string;
    email: string;
}

export interface UpdateProfilePayload {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
}
