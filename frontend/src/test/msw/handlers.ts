import { http, HttpResponse } from 'msw';

export const handlers = [
    http.post('http://localhost:5000/api/auth/register', async () =>
        HttpResponse.json({
            id: '11111111-1111-1111-1111-111111111111',
            fullName: 'Alice Johnson',
            username: 'alice',
            token: 'test-jwt-token',
            refreshToken: 'test-refresh-token'
        })
    ),
    http.get('http://localhost:5000/api/tasks', async () =>
        HttpResponse.json([
            {
                id: '22222222-2222-2222-2222-222222222222',
                title: 'Mock Task',
                description: 'From MSW',
                dueDate: null,
                isCompleted: false,
                ownerId: '11111111-1111-1111-1111-111111111111',
                assignedToId: '11111111-1111-1111-1111-111111111111'
            }
        ])
    ),
    http.post('http://localhost:5000/api/auth/forgot-password', async () =>
        HttpResponse.json({
            message: 'If the account exists, a reset token has been generated.',
            resetToken: 'sample-reset-token'
        })
    ),
    http.post('http://localhost:5000/api/auth/reset-password', async () =>
        HttpResponse.json({
            message: 'Password has been reset successfully.'
        })
    )
];
