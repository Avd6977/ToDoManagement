import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

const TEST_USER = {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Alice Johnson',
    email: 'alice@todo.local'
};
const TEST_ACCESS_TOKEN = 'test-jwt-token';
const TEST_REFRESH_TOKEN = 'test-refresh-token';

const setAuthenticatedSession = (): void => {
    localStorage.setItem('todo_jwt', TEST_ACCESS_TOKEN);
    localStorage.setItem('todo_refresh_token', TEST_REFRESH_TOKEN);
    localStorage.setItem('todo_user', JSON.stringify(TEST_USER));
};

describe('App auth screen', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('opens sort menu and allows selecting due date with descending direction', async () => {
        const user = userEvent.setup();

        setAuthenticatedSession();

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

        setAuthenticatedSession();

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

        setAuthenticatedSession();

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

        setAuthenticatedSession();

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

    it('shows applied filter count bubble and active icon state when filters differ from defaults', async () => {
        const user = userEvent.setup();

        setAuthenticatedSession();

        render(
            <MemoryRouter initialEntries={['/tasks']}>
                <App />
            </MemoryRouter>
        );

        const sortButton = await screen.findByRole('button', { name: 'Sort and Filter' });

        await user.click(sortButton);
        await user.click(screen.getByRole('button', { name: 'Due Date' }));

        const filterButton = await screen.findByRole('button', { name: 'Sort and Filter' });
        expect(filterButton.className.includes('active-filter')).toBe(true);
        expect(screen.getByLabelText('1 applied filters')).toBeInTheDocument();
    });

    it('resets filters back to defaults from the popover', async () => {
        const user = userEvent.setup();

        setAuthenticatedSession();

        render(
            <MemoryRouter initialEntries={['/tasks']}>
                <App />
            </MemoryRouter>
        );

        const sortButton = await screen.findByRole('button', { name: 'Sort and Filter' });

        await user.click(sortButton);
        await user.click(screen.getByRole('button', { name: 'Due Date' }));

        await user.click(await screen.findByRole('button', { name: 'Sort and Filter' }));
        await user.click(screen.getByRole('button', { name: 'Overdue Only' }));

        await user.click(await screen.findByRole('button', { name: 'Sort and Filter' }));
        await user.click(screen.getByRole('button', { name: 'Reset Filters' }));

        expect(screen.queryByLabelText(/applied filters/)).not.toBeInTheDocument();
        expect((await screen.findByRole('button', { name: 'Sort and Filter' })).className.includes('active-filter')).toBe(false);
    });

    it('renders profile screen at /profile for authenticated users', async () => {
        setAuthenticatedSession();

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

    it('navigates to register screen when register button is clicked', async () => {
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
