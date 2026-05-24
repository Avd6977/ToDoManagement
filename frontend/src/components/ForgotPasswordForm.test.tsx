import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
    it('shows validation error when username is empty', async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordForm />);

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
