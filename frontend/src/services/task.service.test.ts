import { describe, expect, it } from 'vitest';
import { getTasks } from 'src/services/task.service';
import { getSession } from 'src/services/auth.service';
import { server } from 'src/test/msw/server';
import { setMockAuthenticatedSession } from 'src/test/msw/handlers';
import { http, HttpResponse } from 'msw';

describe('task service', () => {
    it('getTasks returns tasks from mocked API', async () => {
        const tasks = await getTasks();

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
        expect(tasks.page).toBe(1);
        expect(tasks.pageSize).toBe(25);
    });

    it('getTasks supports alphabetical sort option', async () => {
        const tasks = await getTasks({ sort: 'alphabetical' });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'Already done' });
        expect(tasks.items[1]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports descending alphabetical sort direction', async () => {
        const tasks = await getTasks({
            sort: 'alphabetical',
            sortDirection: 'desc'
        });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
        expect(tasks.items[1]).toMatchObject({ description: 'Already done' });
    });

    it('getTasks supports dueDate sort option', async () => {
        const tasks = await getTasks({ sort: 'dueDate', sortDirection: 'asc' });

        expect(tasks.items).toHaveLength(2);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports overdue status filter', async () => {
        const tasks = await getTasks({ status: 'overdue' });

        expect(tasks.items).toHaveLength(1);
        expect(tasks.items[0]).toMatchObject({ description: 'From MSW' });
    });

    it('getTasks supports explicit paging parameters', async () => {
        const tasks = await getTasks({ page: 2, pageSize: 25 });

        expect(tasks.page).toBe(2);
        expect(tasks.pageSize).toBe(25);
        expect(tasks.totalPages).toBeGreaterThan(1);
        expect(tasks.items).toHaveLength(25);
    });

    it('logs out server-side when refresh fails after unauthorized request', async () => {
        setMockAuthenticatedSession(true);

        server.use(
            http.get('http://localhost:5000/api/tasks', async () =>
                HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
            ),
            http.post('http://localhost:5000/api/auth/refresh', async () =>
                HttpResponse.json(
                    { message: 'Refresh token is no longer active.' },
                    { status: 401 }
                )
            )
        );

        await expect(getTasks()).rejects.toBeTruthy();

        const session = await getSession();
        expect(session).toBeNull();
    });
});
