import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
    it('shows counters and max lengths for full name and username fields', () => {
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} onBackToLoginClick={onBackToLoginClick} />);

        expect(screen.getByText('0/100')).toBeInTheDocument();
        expect(screen.getByText('0/50')).toBeInTheDocument();
        expect(screen.getByLabelText(/^Full Name/)).toHaveAttribute('maxLength', '100');
        expect(screen.getByLabelText(/^Username/)).toHaveAttribute('maxLength', '50');
    });

    it('shows password validation error only after password field is touched', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} onBackToLoginClick={onBackToLoginClick} />);

        expect(screen.queryByText('Password must contain at least one number.')).not.toBeInTheDocument();

        await user.type(screen.getByLabelText(/^Full Name/), 'Alice Johnson');
        await user.type(screen.getByLabelText(/^Username/), 'alice');
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
        await user.type(screen.getByLabelText(/^Username/), 'alice');
        await user.type(screen.getByLabelText(/^Password/), 'Strong1!');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('button', { name: 'Register' })).toBeInTheDocument();
        expect(onAuthenticated).toHaveBeenCalledTimes(1);
        expect(onAuthenticated.mock.calls[0][0]).toMatchObject({
            fullName: 'Alice Johnson',
            username: 'alice',
            token: 'test-jwt-token',
            refreshToken: 'test-refresh-token'
        });
    });

    it('calls back to login when Back to Login is clicked', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();
        const onBackToLoginClick = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} onBackToLoginClick={onBackToLoginClick} />);

        await user.click(screen.getByRole('button', { name: 'Back to Login' }));

        expect(onBackToLoginClick).toHaveBeenCalledTimes(1);
        expect(onAuthenticated).not.toHaveBeenCalled();
    });
});
