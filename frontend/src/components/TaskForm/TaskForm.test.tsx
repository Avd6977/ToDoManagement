import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from 'src/components/TaskForm/TaskForm';

const toLocalDateInputValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

describe('TaskForm', () => {
    it('disables Save Changes when form is invalid', () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <TaskForm
                submitLabel="Save Changes"
                onSubmit={onSubmit}
            />
        );

        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });

    it('blocks past due dates when minDueDate is provided', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayValue = toLocalDateInputValue(yesterday);
        const todayValue = toLocalDateInputValue(today);

        render(
            <TaskForm
                submitLabel="Create Task"
                onSubmit={onSubmit}
                minDueDate={todayValue}
            />
        );

        await user.type(screen.getByLabelText(/^Description/), 'Description');
        await user.type(screen.getByLabelText('Due Date'), yesterdayValue);
        await user.click(screen.getByRole('button', { name: 'Create Task' }));

        expect(screen.getByLabelText('Due Date')).toHaveAttribute('min', todayValue);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('blocks changing due date to a past value during edit flow', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayValue = toLocalDateInputValue(yesterday);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowValue = toLocalDateInputValue(tomorrow);

        render(
            <TaskForm
                submitLabel="Save Changes"
                onSubmit={onSubmit}
                enforceNoPastDueDateChanges
                initialValue={{
                    description: 'Description',
                    dueDate: tomorrowValue
                }}
            />
        );

        const dueDateInput = screen.getByLabelText(/^Due Date/);
        await user.clear(dueDateInput);
        await user.type(dueDateInput, yesterdayValue);
        await user.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(screen.getByText('Due date cannot be changed to a past date.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('allows saving edit flow when existing past due date is unchanged', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayValue = toLocalDateInputValue(yesterday);

        render(
            <TaskForm
                submitLabel="Save Changes"
                onSubmit={onSubmit}
                enforceNoPastDueDateChanges
                initialValue={{
                    description: 'Description',
                    dueDate: yesterdayValue
                }}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('allows past due dates when no enforcement flags are enabled', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayValue = toLocalDateInputValue(yesterday);

        render(<TaskForm submitLabel="Save Changes" onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/^Description/), 'Description');
        await user.type(screen.getByLabelText(/^Due Date/), yesterdayValue);
        await user.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
