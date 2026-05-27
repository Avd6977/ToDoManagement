import { beforeEach, describe, expect, it } from 'vitest';
import {
    getApiErrorMessage,
    toasterMessageService
} from 'src/services/toasterMessageService';

describe('toasterMessageService', () => {
    beforeEach(() => {
        toasterMessageService.clear();
    });

    it('publishes error messages to subscribers and dismisses them by id', () => {
        const updates: string[][] = [];
        const unsubscribe = toasterMessageService.subscribe((messages) => {
            updates.push(messages.map((message) => message.message));
        });

        const firstId = toasterMessageService.showError('First failure');
        const secondId = toasterMessageService.showError('Second failure');

        expect(firstId).toMatch(/^toast-/);
        expect(secondId).toMatch(/^toast-/);
        expect(updates.at(-1)).toEqual(['First failure', 'Second failure']);

        toasterMessageService.dismiss(firstId);
        expect(
            toasterMessageService
                .getSnapshot()
                .map((message) => message.message)
        ).toEqual(['Second failure']);

        unsubscribe();
    });

    it('clears all messages', () => {
        toasterMessageService.showError('Failure');

        toasterMessageService.clear();

        expect(toasterMessageService.getSnapshot()).toEqual([]);
    });

    it('extracts API error message or falls back when unavailable', () => {
        const axiosError = {
            isAxiosError: true,
            response: {
                data: {
                    message: 'Server is down'
                }
            }
        };

        expect(getApiErrorMessage(axiosError, 'Fallback')).toBe(
            'Server is down'
        );
        expect(getApiErrorMessage(new Error('Plain error'), 'Fallback')).toBe(
            'Plain error'
        );
        expect(getApiErrorMessage({}, 'Fallback')).toBe('Fallback');
    });
});
