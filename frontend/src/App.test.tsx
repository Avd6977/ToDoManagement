import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App auth screen', () => {
    it('opens sort menu and allows selecting due date with descending direction', async () => {
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

        const sortButton = await screen.findByRole('button', {
            name: 'Sort and Filter'
        });

        await user.click(sortButton);
        await user.click(screen.getByRole('button', { name: 'Due Date' }));

        await user.click(sortButton);
        await user.click(screen.getByRole('button', { name: 'Descending' }));

        expect(screen.queryByRole('menu', { name: 'Sort and Filter options' })).not.toBeInTheDocument();
    });

    it('closes sort menu when clicking outside of the popover', async () => {
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

        const sortButton = await screen.findByRole('button', {
            name: 'Sort and Filter'
        });

        await user.click(sortButton);
        expect(screen.getByRole('menu', { name: 'Sort and Filter options' })).toBeInTheDocument();

        await user.click(screen.getByRole('heading', { name: 'Task Dashboard' }));

        expect(screen.queryByRole('menu', { name: 'Sort and Filter options' })).not.toBeInTheDocument();
    });

    it('hides completed section when overdue-only filter is enabled', async () => {
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

        const sortButton = await screen.findByRole('button', {
            name: 'Sort and Filter'
        });

        await user.click(sortButton);
        await user.click(screen.getByRole('button', { name: 'Overdue Only' }));

        expect(screen.queryByRole('button', { name: /Completed/i })).not.toBeInTheDocument();
    });

    it('renders separate pagination controls for in progress and completed tasks', async () => {
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

        expect(await screen.findByRole('navigation', { name: 'In Progress pagination' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Last Page' }).length).toBeGreaterThan(0);
        expect(screen.getByRole('combobox', { name: 'Page Size' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Completed/i }));

        expect(await screen.findByRole('navigation', { name: 'Completed pagination' })).toBeInTheDocument();
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
