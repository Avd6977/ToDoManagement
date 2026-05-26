import { http, HttpResponse } from 'msw';

export const handlers = [
    http.post('http://localhost:5000/api/auth/register', async () =>
        HttpResponse.json({
            id: '11111111-1111-1111-1111-111111111111',
            fullName: 'Alice Johnson',
            username: 'alice@todo.local',
            token: 'test-jwt-token',
            refreshToken: 'test-refresh-token'
        })
    ),
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
                dueDate: '2026-05-20T00:00:00.000Z',
                isCompleted: false
            },
            {
                id: '33333333-3333-3333-3333-333333333333',
                description: 'Already done',
                dueDate: '2026-06-15T00:00:00.000Z',
                isCompleted: true
            }
        ];

        const pagedTasks = [
            ...Array.from({ length: 30 }, (_, index) => ({
                id: `open-task-${index + 1}`,
                description: `Open Task ${String(index + 1).padStart(2, '0')}`,
                dueDate: index % 3 === 0 ? '2026-05-20T00:00:00.000Z' : null,
                isCompleted: false
            })),
            ...Array.from({ length: 30 }, (_, index) => ({
                id: `completed-task-${index + 1}`,
                description: `Completed Task ${String(index + 1).padStart(2, '0')}`,
                dueDate: '2026-06-15T00:00:00.000Z',
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

                          return new Date(task.dueDate).getTime() < Date.now();
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
                            ? new Date(left.dueDate).getTime()
                            : Number.MAX_SAFE_INTEGER;
                        const rightDate = right.dueDate
                            ? new Date(right.dueDate).getTime()
                            : Number.MAX_SAFE_INTEGER;

                        return sortDirection === 'desc'
                            ? rightDate - leftDate
                            : leftDate - rightDate;
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
