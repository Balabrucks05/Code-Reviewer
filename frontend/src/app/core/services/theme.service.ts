import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly storageKey = 'contract-guard-theme';

    // Current user preference (persisted)
    preference = signal<Theme>(this.getStoredTheme());

    // System preference (live)
    systemPref = signal<'light' | 'dark'>(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    // Effective theme (what actually renders)
    currentTheme = computed(() => {
        const pref = this.preference();
        return pref === 'system' ? this.systemPref() : pref;
    });

    constructor() {
        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.systemPref.set(e.matches ? 'dark' : 'light');
        });

        // Apply theme whenever effective theme changes
        effect(() => {
            const theme = this.currentTheme();
            document.documentElement.setAttribute('data-theme', theme);

            // Update meta theme-color for mobile browsers
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#ffffff');
            }
        });

        // Save preference whenever it changes
        effect(() => {
            localStorage.setItem(this.storageKey, this.preference());
        });
    }

    setTheme(theme: Theme) {
        this.preference.set(theme);
    }

    private getStoredTheme(): Theme {
        const stored = localStorage.getItem(this.storageKey);
        return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    }
}
