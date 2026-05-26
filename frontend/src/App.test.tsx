import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App auth screen', () => {
    it('toggles alphabetical sort direction when selected twice', async () => {
        const user = userEvent.setup();

        localStorage.setItem('todo_jwt', 'test-jwt-token');
        localStorage.setItem('todo_refresh_token', 'test-refresh-token');
        localStorage.setItem(
            'todo_user',
            JSON.stringify({
                id: '11111111-1111-1111-1111-111111111111',
                fullName: 'Alice Johnson',
                email: 'alice@todo.local'
            })
        );

        render(
            <MemoryRouter initialEntries={['/tasks']}>
                <App />
            </MemoryRouter>
        );

        const alphabeticalButton = await screen.findByRole('button', {
            name: 'Alphabetical (A-Z)'
        });

        await user.click(alphabeticalButton);
        await user.click(screen.getByRole('button', { name: 'Alphabetical (A-Z)' }));

        expect(await screen.findByRole('button', { name: 'Alphabetical (Z-A)' })).toBeInTheDocument();
    });

    it('renders profile screen at /profile for authenticated users', async () => {
        localStorage.setItem('todo_jwt', 'test-jwt-token');
        localStorage.setItem('todo_refresh_token', 'test-refresh-token');
        localStorage.setItem(
            'todo_user',
            JSON.stringify({
                id: '11111111-1111-1111-1111-111111111111',
                fullName: 'Alice Johnson',
                email: 'alice@todo.local'
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

});
