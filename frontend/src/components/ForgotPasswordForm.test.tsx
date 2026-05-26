import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
    it('disables submit until username is valid and only shows error after touch', async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordForm />);

        const submitButton = screen.getByRole('button', { name: 'Request Reset' });
        expect(submitButton).toBeDisabled();
        expect(screen.queryByText('Username is required.')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Username'));
        await user.tab();
        await user.click(screen.getByRole('button', { name: 'Request Reset' }));

        expect(screen.getByText('Username is required.')).toBeInTheDocument();
    });

    it('shows success message and token preview after request', async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordForm />);

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.click(screen.getByRole('button', { name: 'Request Reset' }));

        expect(await screen.findByText('If the account exists, a reset token has been generated.')).toBeInTheDocument();
        expect(screen.getByText(/Reset token:/)).toBeInTheDocument();
    });
});
