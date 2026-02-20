import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar glass-premium">
      <div class="navbar-container">
        <a routerLink="/" class="navbar-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6366f1"/>
                  <stop offset="50%" stop-color="#8b5cf6"/>
                  <stop offset="100%" stop-color="#a855f7"/>
                </linearGradient>
              </defs>
              <path d="M20 4L4 12v16l16 8 16-8V12L20 4z" stroke="url(#logoGradient)" stroke-width="2" fill="none"/>
              <path d="M12 18l5 5 11-11" stroke="url(#logoGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <span class="brand-text gradient-text-animated">ContractGuard</span>
        </a>

        <div class="navbar-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </a>
          <a routerLink="/analyze" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Analyze
          </a>
        </div>

        <div class="navbar-actions">
          <button class="btn btn-primary btn-liquid glow" routerLink="/analyze">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Audit
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: var(--z-sticky);
      height: 70px;
      transition: background 0.3s var(--ease-out-expo);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-6);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--color-text-primary);
      font-weight: 600;
      font-size: 1.25rem;
      text-decoration: none;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-icon svg {
      width: 100%;
      height: 100%;
    }

    .brand-text {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar-links {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: all 0.2s var(--ease-out-expo);
    }

    .nav-link:hover {
      color: var(--color-text-primary);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: var(--color-accent-primary);
      background: rgba(99, 102, 241, 0.1);
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
      .navbar { height: 60px; }
      .navbar-container { padding: 0 var(--space-4); }
      .brand-text { font-size: 1rem; }
      .brand-icon { width: 28px; height: 28px; }
      .nav-link {
        padding: var(--space-2);
        font-size: 0;
        gap: 0;
      }
      .nav-link svg { font-size: initial; }
      .navbar-actions .btn {
        padding: var(--space-2) var(--space-3);
        font-size: 0;
        gap: 0;
      }
      .navbar-actions .btn svg { font-size: initial; }
    }

    @media (max-width: 480px) {
      .navbar { height: 52px; }
      .navbar-container { padding: 0 var(--space-3); }
      .navbar-brand { gap: var(--space-2); }
      .brand-text { font-size: 0.9rem; }
    }
  `]
})
export class NavbarComponent { }
