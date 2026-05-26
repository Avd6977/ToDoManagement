import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
    it('opens profile menu, navigates to profile, and closes on outside click', async () => {
        const onLogout = vi.fn();
        const onProfileClick = vi.fn();
        const userEventSetup = userEvent.setup();

        render(
            <>
                <button type="button">Outside</button>
                <AppHeader
                    title="Task Dashboard"
                    fullName="Alice Johnson"
                    onLogout={onLogout}
                    onProfileClick={onProfileClick}
                />
            </>
        );

        await userEventSetup.click(screen.getByRole('button', { name: 'Profile' }));
        expect(screen.getByRole('menuitem', { name: 'Alice Johnson' })).toBeInTheDocument();

        await userEventSetup.click(screen.getByRole('menuitem', { name: 'Alice Johnson' }));
        expect(onProfileClick).toHaveBeenCalledTimes(1);

        await userEventSetup.click(screen.getByRole('button', { name: 'Profile' }));
        expect(screen.getByRole('menuitem', { name: 'Logout' })).toBeInTheDocument();

        await userEventSetup.click(screen.getByRole('button', { name: 'Outside' }));
        expect(screen.queryByRole('menuitem', { name: 'Logout' })).not.toBeInTheDocument();
    });

    it('triggers logout from dropdown', async () => {
        const onLogout = vi.fn();
        const onProfileClick = vi.fn();
        const userEventSetup = userEvent.setup();

        render(
            <AppHeader
                title="Task Dashboard"
                fullName="Alice Johnson"
                onLogout={onLogout}
                onProfileClick={onProfileClick}
            />
        );

        await userEventSetup.click(screen.getByRole('button', { name: 'Profile' }));
        await userEventSetup.click(screen.getByRole('menuitem', { name: 'Logout' }));

        expect(onLogout).toHaveBeenCalledTimes(1);
    });
});
