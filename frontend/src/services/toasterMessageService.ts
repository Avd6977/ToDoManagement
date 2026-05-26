import axios from 'axios';

export interface ToasterMessage {
    id: string;
    message: string;
    variant: 'error';
}

type Listener = (messages: ToasterMessage[]) => void;

class ToasterMessageService {
    private listeners = new Set<Listener>();
    private messages: ToasterMessage[] = [];
    private nextId = 0;

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.messages);

        return () => {
            this.listeners.delete(listener);
        };
    }

    showError(message: string): string {
        const id = `toast-${this.nextId}`;
        this.nextId += 1;

        this.messages = [...this.messages, { id, message, variant: 'error' }];
        this.emit();
        return id;
    }

    dismiss(id: string): void {
        this.messages = this.messages.filter((message) => message.id !== id);
        this.emit();
    }

    clear(): void {
        this.messages = [];
        this.emit();
    }

    getSnapshot(): ToasterMessage[] {
        return this.messages;
    }

    private emit(): void {
        this.listeners.forEach((listener) => listener(this.messages));
    }
}

export const toasterMessageService = new ToasterMessageService();

export const getApiErrorMessage = (
    error: unknown,
    fallbackMessage: string
): string => {
    if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data?.message;
        if (typeof responseMessage === 'string' && responseMessage.trim()) {
            return responseMessage;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
};
