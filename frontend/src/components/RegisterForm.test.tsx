import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
    it('shows validation error for weak password', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} />);

        await user.type(screen.getByLabelText('Full Name'), 'Alice Johnson');
        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: 'Register' }));

        expect(screen.getByText('Password must contain at least one number.')).toBeInTheDocument();
        expect(onAuthenticated).not.toHaveBeenCalled();
    });

    it('submits and authenticates when password meets requirements', async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();

        render(<RegisterForm onAuthenticated={onAuthenticated} />);

        await user.type(screen.getByLabelText('Full Name'), 'Alice Johnson');
        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Password'), 'Strong1!');
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
});
