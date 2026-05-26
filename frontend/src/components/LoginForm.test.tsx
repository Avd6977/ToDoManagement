import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    it('disables submit until required fields are valid', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onRegisterClick = vi.fn();
        const onForgotPasswordClick = vi.fn();

        render(
            <LoginForm
                onAuthenticated={onAuthenticated}
                onRegisterClick={onRegisterClick}
                onForgotPasswordClick={onForgotPasswordClick}
            />
        );

        const submitButton = screen.getByRole('button', { name: 'Login' });
        expect(submitButton).toBeDisabled();
        expect(screen.queryByText('Username is required.')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Username'));
        await user.tab();
        expect(screen.getByText('Username is required.')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Password'), 'Strong1!');

        expect(submitButton).toBeEnabled();
    });

    it('navigates with Register and Forgot Password links', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onRegisterClick = vi.fn();
        const onForgotPasswordClick = vi.fn();

        render(
            <LoginForm
                onAuthenticated={onAuthenticated}
                onRegisterClick={onRegisterClick}
                onForgotPasswordClick={onForgotPasswordClick}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Register' }));
        await user.click(screen.getByRole('button', { name: 'Forgot Password?' }));

        expect(onRegisterClick).toHaveBeenCalledTimes(1);
        expect(onForgotPasswordClick).toHaveBeenCalledTimes(1);
    });
});
