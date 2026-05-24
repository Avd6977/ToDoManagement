import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
    it('shows validation error when required fields are missing', async () => {
        const user = userEvent.setup();
        render(<ResetPasswordForm />);

        await user.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Reset token and new password are required.')).toBeInTheDocument();
    });

    it('resets password successfully with valid token and password', async () => {
        const user = userEvent.setup();
        render(<ResetPasswordForm />);

        await user.type(screen.getByLabelText('Reset Token'), 'sample-reset-token');
        await user.type(screen.getByLabelText('New Password'), 'Strong1!');
        await user.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(await screen.findByText('Password reset successfully. You can now log in.')).toBeInTheDocument();
    });
});
