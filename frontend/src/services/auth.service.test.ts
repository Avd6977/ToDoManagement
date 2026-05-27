import { describe, expect, it } from 'vitest';
import { getSession, register } from 'src/services/auth.service';
import { setMockAuthenticatedSession } from 'src/test/msw/handlers';

describe('auth service', () => {
    it('register returns authenticated user profile from mocked API', async () => {
        const user = await register(
            'Alice Johnson',
            'alice@todo.local',
            'Strong1!'
        );

        expect(user).toMatchObject({
            fullName: 'Alice Johnson',
            email: 'alice@todo.local'
        });
    });

    it('getSession returns null when no active cookie session exists', async () => {
        const user = await getSession();

        expect(user).toBeNull();
    });

    it('getSession returns active cookie-authenticated user profile', async () => {
        setMockAuthenticatedSession(true);

        const user = await getSession();

        expect(user).toMatchObject({
            fullName: 'Alice Johnson',
            email: 'alice@todo.local'
        });
    });
});
