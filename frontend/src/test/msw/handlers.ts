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
        const sort = (url.searchParams.get('sort') ?? 'recentlyadded')
            .replace('_', '')
            .replace('-', '')
            .toLowerCase();
        const sortDirection = (
            url.searchParams.get('sortDirection') ?? 'asc'
        ).toLowerCase();

        const allTasks = [
            {
                id: '22222222-2222-2222-2222-222222222222',
                title: 'Mock Task',
                description: 'From MSW',
                dueDate: null,
                isCompleted: false
            },
            {
                id: '33333333-3333-3333-3333-333333333333',
                title: 'Completed Task',
                description: 'Already done',
                dueDate: null,
                isCompleted: true
            }
        ];

        const filteredByStatus =
            status === 'open'
                ? allTasks.filter((task) => !task.isCompleted)
                : status === 'completed'
                  ? allTasks.filter((task) => task.isCompleted)
                  : allTasks;

        const filtered = search
            ? filteredByStatus.filter(
                  (task) =>
                      task.title.toLowerCase().includes(search) ||
                      task.description.toLowerCase().includes(search)
              )
            : filteredByStatus;

        const sorted =
            sort === 'alphabetical'
                ? [...filtered].sort((left, right) =>
                      sortDirection === 'desc'
                          ? right.title.localeCompare(left.title)
                          : left.title.localeCompare(right.title)
                  )
                : sortDirection === 'desc'
                  ? [...filtered].reverse()
                  : filtered;

        return HttpResponse.json({
            items: sorted,
            page: 1,
            pageSize: 25,
            totalCount: sorted.length,
            totalPages: sorted.length ? 1 : 0
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
