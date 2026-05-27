import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { setMockAuthenticatedSession } from 'src/test/msw/handlers';
import App from 'src/App';

const setAuthenticatedSession = (): void => {
    setMockAuthenticatedSession(true);
};

describe('App auth screen', () => {
    beforeEach(() => {
        localStorage.clear();
        setMockAuthenticatedSession(false);
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

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /Completed/i })).not.toBeInTheDocument();
        });
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


    it('renders profile screen at /profile for authenticated users', async () => {
        setAuthenticatedSession();

        render(
            <MemoryRouter initialEntries={['/profile']}>
                <App />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('defaults home route to login screen', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Register' })).not.toBeInTheDocument();
    });

    it('navigates to register screen when register button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        await user.click(await screen.findByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('heading', { name: 'Register' })).toBeInTheDocument();
    });

});
