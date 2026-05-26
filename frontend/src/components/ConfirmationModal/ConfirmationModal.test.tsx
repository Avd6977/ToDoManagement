import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
    it('defaults the confirm button title to Confirm', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn().mockResolvedValue(undefined);

        render(
            <ConfirmationModal
                isOpen
                modalTitle="Archive item?"
                content="This cannot be undone."
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('uses the provided confirm button title', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        const onCancel = vi.fn();

        render(
            <ConfirmationModal
                isOpen
                modalTitle="Delete task?"
                content="This action cannot be undone."
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmButtonTitle="Delete"
            />
        );

        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls onCancel when clicking outside the modal card', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();

        render(
            <ConfirmationModal
                isOpen
                modalTitle="Delete task?"
                content="Are you sure you want to delete this task?"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        await user.click(screen.getByRole('dialog'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Escape key is pressed', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();

        render(
            <ConfirmationModal
                isOpen
                modalTitle="Delete task?"
                content="Are you sure you want to delete this task?"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        await user.keyboard('{Escape}');

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
