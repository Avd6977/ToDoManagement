import type {
    ApiProfileResponse,
    ProfileResponse,
    UpdateProfilePayload
} from 'src/types/ApiAuth';
import { apiClient } from 'src/services/auth.service';

export const updateProfile = async (
    payload: UpdateProfilePayload
): Promise<ProfileResponse> => {
    const response = await apiClient.put<ApiProfileResponse>(
        '/auth/profile',
        payload
    );
    return {
        id: response.data.id,
        fullName: response.data.fullName,
        email: response.data.username
    };
};
