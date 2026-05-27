import { http, HttpResponse } from 'msw';

let isAuthenticatedSessionActive = false;

export const setMockAuthenticatedSession = (isAuthenticated: boolean): void => {
    isAuthenticatedSessionActive = isAuthenticated;
};

const buildAuthResponse = (fullName = 'Alice Johnson') => ({
    id: '11111111-1111-1111-1111-111111111111',
    fullName,
    username: 'alice@todo.local'
});

const getTodayDateOnly = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const handlers = [
    http.post('http://localhost:5000/api/auth/register', async () => {
        isAuthenticatedSessionActive = true;
        return HttpResponse.json(buildAuthResponse('Alice Johnson'));
    }),
    http.post('http://localhost:5000/api/auth/login', async () => {
        isAuthenticatedSessionActive = true;
        return HttpResponse.json(buildAuthResponse('Alice Johnson'));
    }),
    http.get('http://localhost:5000/api/auth/session', async () => {
        if (!isAuthenticatedSessionActive) {
            return HttpResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json({
            id: '11111111-1111-1111-1111-111111111111',
            fullName: 'Alice Johnson',
            username: 'alice@todo.local'
        });
    }),
    http.post('http://localhost:5000/api/auth/refresh', async () => {
        if (!isAuthenticatedSessionActive) {
            return HttpResponse.json(
                { message: 'Refresh token is required.' },
                { status: 401 }
            );
        }

        return HttpResponse.json(buildAuthResponse('Alice Johnson'));
    }),
    http.post('http://localhost:5000/api/auth/logout', async () => {
        isAuthenticatedSessionActive = false;
        return HttpResponse.json({ message: 'Logged out successfully.' });
    }),
    http.get('http://localhost:5000/api/tasks', async ({ request }) => {
        const url = new URL(request.url);
        const status = (url.searchParams.get('status') ?? 'all').toLowerCase();
        const search = (url.searchParams.get('search') ?? '').toLowerCase();
        const page = Number(url.searchParams.get('page') ?? '1');
        const pageSize = Number(url.searchParams.get('pageSize') ?? '25');
        const sort = (url.searchParams.get('sort') ?? 'recentlyadded')
            .replace('_', '')
            .replace('-', '')
            .toLowerCase();
        const sortDirection = (
            url.searchParams.get('sortDirection') ?? 'asc'
        ).toLowerCase();

        const defaultTasks = [
            {
                id: '22222222-2222-2222-2222-222222222222',
                description: 'From MSW',
                dueDate: '2026-05-20',
                isCompleted: false
            },
            {
                id: '33333333-3333-3333-3333-333333333333',
                description: 'Already done',
                dueDate: '2026-06-15',
                isCompleted: true
            }
        ];

        const pagedTasks = [
            ...Array.from({ length: 30 }, (_, index) => ({
                id: `open-task-${index + 1}`,
                description: `Open Task ${String(index + 1).padStart(2, '0')}`,
                dueDate: index % 3 === 0 ? '2026-05-20' : null,
                isCompleted: false
            })),
            ...Array.from({ length: 30 }, (_, index) => ({
                id: `completed-task-${index + 1}`,
                description: `Completed Task ${String(index + 1).padStart(2, '0')}`,
                dueDate: '2026-06-15',
                isCompleted: true
            }))
        ];

        const allTasks =
            url.searchParams.has('page') || url.searchParams.has('pageSize')
                ? pagedTasks
                : defaultTasks;

        const filteredByStatus =
            status === 'open'
                ? allTasks.filter((task) => !task.isCompleted)
                : status === 'completed'
                  ? allTasks.filter((task) => task.isCompleted)
                  : status === 'overdue'
                    ? allTasks.filter((task) => {
                          if (task.isCompleted || !task.dueDate) {
                              return false;
                          }

                          return task.dueDate < getTodayDateOnly();
                      })
                    : allTasks;

        const filtered = search
            ? filteredByStatus.filter((task) =>
                  task.description.toLowerCase().includes(search)
              )
            : filteredByStatus;

        const sorted =
            sort === 'alphabetical'
                ? [...filtered].sort((left, right) =>
                      sortDirection === 'desc'
                          ? right.description.localeCompare(left.description)
                          : left.description.localeCompare(right.description)
                  )
                : sort === 'duedate'
                  ? [...filtered].sort((left, right) => {
                        const leftDate = left.dueDate
                            ? left.dueDate
                            : '9999-12-31';
                        const rightDate = right.dueDate
                            ? right.dueDate
                            : '9999-12-31';

                        return sortDirection === 'desc'
                            ? rightDate.localeCompare(leftDate)
                            : leftDate.localeCompare(rightDate);
                    })
                  : sortDirection === 'desc'
                    ? [...filtered].reverse()
                    : filtered;

        const totalCount = sorted.length;
        const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;
        const startIndex = Math.max(0, (page - 1) * pageSize);
        const paged = sorted.slice(startIndex, startIndex + pageSize);

        return HttpResponse.json({
            items: paged,
            page,
            pageSize,
            totalCount,
            totalPages
        });
    }),
    http.put('http://localhost:5000/api/auth/profile', async ({ request }) => {
        const body = (await request.json()) as {
            fullName: string;
            currentPassword?: string;
            newPassword?: string;
        };

        if (body.newPassword && body.currentPassword !== 'Strong1!') {
            return HttpResponse.json(
                { message: 'Current password is incorrect.' },
                { status: 400 }
            );
        }

        return HttpResponse.json({
            id: '11111111-1111-1111-1111-111111111111',
            fullName: body.fullName,
            username: 'alice@todo.local'
        });
    })
];
