export interface User {
    id: string;
    fullName: string;
    email: string;
    token?: string;
    refreshToken?: string;
}

export interface UserOption {
    id: string;
    fullName: string;
    email: string;
}
