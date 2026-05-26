import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../types/User';
import { ProfileForm } from './ProfileForm';

describe('ProfileForm', () => {
    const user: User = {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Alice Johnson',
        username: 'alice'
    };

    it('requires current password when new password is provided', async () => {
        const onSave = vi.fn();
        const userEventSetup = userEvent.setup();

        render(<ProfileForm user={user} onSave={onSave} />);

        await userEventSetup.clear(screen.getByLabelText('Full Name'));
        await userEventSetup.type(screen.getByLabelText('Full Name'), 'Alice Johnson');
        await userEventSetup.type(screen.getByLabelText('New Password'), 'NewStrong1!');
        await userEventSetup.tab();

        expect(screen.getByText('Current password is required to set a new password.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save Profile' })).toBeDisabled();

        await userEventSetup.click(screen.getByRole('button', { name: 'Save Profile' }));

        expect(onSave).not.toHaveBeenCalled();
    });

    it('disables username and submits profile payload', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const userEventSetup = userEvent.setup();

        render(<ProfileForm user={user} onSave={onSave} />);

        const usernameInput = screen.getByLabelText('Username');
        expect(usernameInput).toBeDisabled();

        await userEventSetup.clear(screen.getByLabelText('Full Name'));
        await userEventSetup.type(screen.getByLabelText('Full Name'), 'Alice Updated');
        await userEventSetup.type(screen.getByLabelText('Current Password'), 'Strong1!');
        await userEventSetup.type(screen.getByLabelText('New Password'), 'NewStrong1!');
        await userEventSetup.click(screen.getByRole('button', { name: 'Save Profile' }));

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith({
            fullName: 'Alice Updated',
            currentPassword: 'Strong1!',
            newPassword: 'NewStrong1!'
        });
        expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
    });
});
