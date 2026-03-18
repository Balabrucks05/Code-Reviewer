import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="auth-wrapper">
        <div class="auth-card glass-premium">
          <h2>Sign In</h2>
          <p class="text-secondary">Sign in to save and track your analyses</p>
          <div id="google-signin-button"></div>
          <a routerLink="/dashboard" class="btn btn-ghost">Continue as Guest</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .auth-card {
      padding: var(--space-10);
      border-radius: var(--radius-xl);
      text-align: center;
      max-width: 400px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `],
})
export class AuthComponent {}
