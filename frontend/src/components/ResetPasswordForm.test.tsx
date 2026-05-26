import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
    it('disables submit until fields are valid and shows field errors only after touch', async () => {
        const user = userEvent.setup();
        render(<ResetPasswordForm />);

        const submitButton = screen.getByRole('button', { name: 'Reset Password' });
        expect(submitButton).toBeDisabled();
        expect(screen.queryByText('Reset token is required.')).not.toBeInTheDocument();
        expect(screen.queryByText('New password is required.')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Reset Token'));
        await user.tab();
        await user.click(screen.getByLabelText('New Password'));
        await user.tab();
        await user.click(screen.getByRole('button', { name: 'Reset Password' }));

        expect(screen.getByText('Reset token is required.')).toBeInTheDocument();
        expect(screen.getByText('New password is required.')).toBeInTheDocument();
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
