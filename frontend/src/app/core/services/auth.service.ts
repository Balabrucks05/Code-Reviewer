import { Injectable, signal } from '@angular/core';

export interface User {
    id: string;
    name: string;
    email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private authenticated = signal<boolean>(false);
    private user = signal<User | null>(null);

    isAuthenticated = this.authenticated.asReadonly();
    currentUser = this.user.asReadonly();

    setAuthenticated(value: boolean | User): void {
        if (typeof value === 'boolean') {
            this.authenticated.set(value);
            if (value) {
                this.user.set({ id: 'usr_mock_123456789', name: 'Test User', email: 'test@example.com' });
            } else {
                this.user.set(null);
            }
        } else {
            this.authenticated.set(true);
            this.user.set(value);
        }
    }

    logout(): void {
        this.authenticated.set(false);
        this.user.set(null);
    }
}
