export interface User {
    id: string;
    fullName: string;
    username: string;
    token?: string;
    refreshToken?: string;
}

export interface UserOption {
    id: string;
    fullName: string;
    username: string;
}
