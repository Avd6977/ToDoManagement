import { describe, expect, it } from 'vitest';
import {
    getTasks,
    register,
    updateProfile,
    updateStoredUserFullName
} from './api';

describe('api service', () => {
    it('register stores token and user in localStorage from mocked API', async () => {
        const user = await register(
            'Alice Johnson',
            'alice@todo.local',
            'Strong1!'
        );

        expect(user).toMatchObject({
            fullName: 'Alice Johnson',
            email: 'alice@todo.local',
            token: 'test-jwt-token',
            refreshToken: 'test-refresh-token'
        });
        expect(localStorage.getItem('todo_jwt')).toBe('test-jwt-token');
        expect(localStorage.getItem('todo_refresh_token')).toBe(
            'test-refresh-token'
        );
        expect(localStorage.getItem('todo_user')).toContain('alice@todo.local');
    });

    it('getTasks returns tasks from mocked API', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks();

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
        expect(tasks.page).toBe(1);
        expect(tasks.pageSize).toBe(25);
    });

    it('getTasks supports alphabetical sort option', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks({ sort: 'alphabetical' });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'Already done' });
        expect(tasks.items[1]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports descending alphabetical sort direction', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks({
            sort: 'alphabetical',
            sortDirection: 'desc'
        });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
        expect(tasks.items[1]).toMatchObject({ description: 'Already done' });
    });

    it('getTasks supports dueDate sort option', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks({ sort: 'dueDate', sortDirection: 'asc' });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports overdue status filter', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks({ status: 'overdue' });

        expect(tasks.items).toHaveLength(1);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports explicit paging parameters', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

        const tasks = await getTasks({ page: 2, pageSize: 25 });

        expect(tasks.page).toBe(2);
        expect(tasks.pageSize).toBe(25);
        expect(tasks.totalPages).toBeGreaterThan(1);
        expect(tasks.items).toHaveLength(25);
    });

    it('updateProfile returns updated user profile from mocked API', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');

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

    it('updateStoredUserFullName updates cached user full name only', () => {
        localStorage.setItem(
            'todo_user',
            JSON.stringify({
                id: '11111111-1111-1111-1111-111111111111',
                fullName: 'Alice Johnson',
                email: 'alice@todo.local'
            })
        );

        updateStoredUserFullName('Alice Updated');

        expect(localStorage.getItem('todo_user')).toContain('Alice Updated');
        expect(localStorage.getItem('todo_user')).toContain('alice@todo.local');
    });
});
