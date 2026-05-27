import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from 'src/components/RegisterForm/RegisterForm';

describe('RegisterForm', () => {
    it('shows password validation error only after password field is touched', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} onBackToLoginClick={onBackToLoginClick} />);

        expect(screen.queryByText('Password must contain at least one number.')).not.toBeInTheDocument();

        await user.type(screen.getByLabelText(/^Full Name/), 'Alice Johnson');
        await user.type(screen.getByLabelText(/^Email/), 'alice@todo.local');
        await user.type(screen.getByLabelText(/^Password/), 'password');
        await user.tab();

        expect(screen.getByText('Password must contain at least one number.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(onAuthenticated).not.toHaveBeenCalled();
    });

    it('submits and authenticates when password meets requirements', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} onBackToLoginClick={onBackToLoginClick} />);

        await user.type(screen.getByLabelText(/^Full Name/), 'Alice Johnson');
        await user.type(screen.getByLabelText(/^Email/), 'alice@todo.local');
        await user.type(screen.getByLabelText(/^Password/), 'Strong1!');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('button', { name: 'Register' })).toBeInTheDocument();
        expect(onAuthenticated).toHaveBeenCalledTimes(1);
        expect(onAuthenticated.mock.calls[0][0]).toMatchObject({
            fullName: 'Alice Johnson',
            email: 'alice@todo.local'
        });
    });

    it('calls back to login when Back to Login is clicked', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();
        const onCancel = vi.fn();

        render(
            <RegisterForm
                onAuthenticated={onAuthenticated}
                onBackToLoginClick={onBackToLoginClick}
                onCancel={onCancel}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Back' }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onBackToLoginClick).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onAuthenticated).not.toHaveBeenCalled();
    });
});
