import { useEffect, useState } from 'react';
import {
    toasterMessageService,
    type ToasterMessage
} from 'src/services/toasterMessageService';

const TOAST_TIMEOUT_MS = 4000;

export const Toaster = (): JSX.Element | null => {
    const [messages, setMessages] = useState<ToasterMessage[]>([]);

    useEffect(() => toasterMessageService.subscribe(setMessages), []);

    useEffect(() => {
        const timeouts = messages.map((message) =>
            window.setTimeout(() => {
                toasterMessageService.dismiss(message.id);
            }, TOAST_TIMEOUT_MS)
        );

        return () => {
            timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [messages]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="toaster" aria-live="assertive" aria-atomic="true">
            {messages.map((message) => (
                <div key={message.id} className={`toast-message toast-${message.variant}`} role="alert">
                    <p>{message.message}</p>
                    <button
                        type="button"
                        className="toast-close-button"
                        aria-label="Dismiss message"
                        onClick={() => toasterMessageService.dismiss(message.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};
