import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    title?: string;
    duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<Toast[]>([]);

    show(options: Omit<Toast, 'id'> & { duration?: number }): void {
        const id = Math.random().toString(36).substring(2, 9);
        const toast: Toast = { ...options as any, id, duration: options.duration || 5000 };
        this.toasts.update(current => [...current, toast]);
        if ((toast.duration ?? 0) > 0) {
            setTimeout(() => this.remove(id), toast.duration!);
        }
    }

    success(message: string, title?: string, duration?: number): void {
        this.show({ type: 'success', message, title, duration });
    }

    error(message: string, title?: string, duration?: number): void {
        this.show({ type: 'error', message, title, duration });
    }

    info(message: string, title?: string, duration?: number): void {
        this.show({ type: 'info', message, title, duration });
    }

    remove(id: string): void {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
