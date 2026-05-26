import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    it('disables submit until required fields are valid', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onRegisterClick = vi.fn();

        render(
            <LoginForm
                onAuthenticated={onAuthenticated}
                onRegisterClick={onRegisterClick}
            />
        );

        const submitButton = screen.getByRole('button', { name: 'Login' });
        expect(submitButton).toBeDisabled();
        expect(screen.queryByText('Email is required.')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Email'));
        await user.tab();
        expect(screen.getByText('Email is required.')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Email'), 'alice@todo.local');
        await user.type(screen.getByLabelText('Password'), 'Strong1!');

        expect(submitButton).toBeEnabled();
    });

    it('navigates with Register button', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onRegisterClick = vi.fn();

        render(
            <LoginForm
                onAuthenticated={onAuthenticated}
                onRegisterClick={onRegisterClick}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(onRegisterClick).toHaveBeenCalledTimes(1);
    });
});
