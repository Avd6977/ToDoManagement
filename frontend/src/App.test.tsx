import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App auth screen', () => {
    it('hides forgot password form until the login link is clicked', async () => {
        const user = userEvent.setup();

        render(<App />);

        expect(screen.queryByRole('heading', { name: 'Forgot Password' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Forgot Password?' }));

        expect(await screen.findByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
    });
});
