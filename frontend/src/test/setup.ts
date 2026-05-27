import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from 'src/test/msw/server';
import { setMockAuthenticatedSession } from 'src/test/msw/handlers';

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    server.resetHandlers();
    setMockAuthenticatedSession(false);
    localStorage.clear();
});

afterAll(() => {
    server.close();
});
