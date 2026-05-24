import { describe, expect, it } from 'vitest';
import { forgotPassword, getTasks, register, resetPassword } from './api';

describe('api service', () => {
    it('register stores token and user in localStorage from mocked API', async () => {
        const user = await register('Alice Johnson', 'alice', 'Strong1!');

        expect(user).toMatchObject({
            fullName: 'Alice Johnson',
            username: 'alice',
            token: 'test-jwt-token',
            refreshToken: 'test-refresh-token'
        });
        expect(localStorage.getItem('todo_jwt')).toBe('test-jwt-token');
        expect(localStorage.getItem('todo_refresh_token')).toBe(
            'test-refresh-token'
        );
        expect(localStorage.getItem('todo_user')).toContain('alice');
    });

    it('getTasks returns tasks from mocked API', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks();

        expect(tasks).toHaveLength(1);
        expect(tasks[0]).toMatchObject({ title: 'Mock Task' });
    });

    it('forgotPassword returns reset token response from mocked API', async () => {
        const response = await forgotPassword('alice');

        expect(response).toMatchObject({
            message: 'If the account exists, a reset token has been generated.',
            resetToken: 'sample-reset-token'
        });
    });

    it('resetPassword succeeds against mocked API', async () => {
        await expect(
            resetPassword('sample-reset-token', 'Strong1!')
        ).resolves.toBeUndefined();
    });
});
