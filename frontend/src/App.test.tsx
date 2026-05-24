import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App auth screen', () => {
    it('renders profile screen at /profile for authenticated users', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');
        localStorage.setItem('todo_refresh_token', 'test-refresh-token');
        localStorage.setItem(
            'todo_user',
            JSON.stringify({
                id: '11111111-1111-1111-1111-111111111111',
                fullName: 'Alice Johnson',
                username: 'alice'
            })
        );

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('defaults home route to login screen', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Forgot Password' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Reset Password' })).not.toBeInTheDocument();
    });

    it('navigates to register screen when register link is clicked', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('heading', { name: 'Register' })).toBeInTheDocument();
    });

    it('navigates to forgot password screen when forgot-password link is clicked', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(screen.queryByRole('heading', { name: 'Forgot Password' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Forgot Password?' }));

        expect(await screen.findByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
    });

    it('blocks reset-password route until forgot-password succeeds', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/reset-password']}>
                <App />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.click(screen.getByRole('button', { name: 'Request Reset' }));

        expect(await screen.findByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });
});
