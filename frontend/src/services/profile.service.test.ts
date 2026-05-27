import { describe, expect, it } from 'vitest';
import { updateProfile } from 'src/services/profile.service';

describe('profile service', () => {
    it('updateProfile returns updated user profile from mocked API', async () => {
        const profile = await updateProfile({
            fullName: 'Alice Updated',
            currentPassword: 'Strong1!',
            newPassword: 'NewStrong1!'
        });

        expect(profile).toMatchObject({
            fullName: 'Alice Updated',
            email: 'alice@todo.local'
        });
    });
});
