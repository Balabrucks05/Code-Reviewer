import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-container">
      <div class="animated-bg"></div>
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding: var(--space-6);
      padding-top: calc(var(--space-6) + 70px);
    }

    @media (max-width: 768px) {
      .main-content {
        padding: var(--space-4);
        padding-top: calc(var(--space-4) + 60px);
      }
    }

    @media (max-width: 480px) {
      .main-content {
        padding: var(--space-3);
        padding-top: calc(var(--space-3) + 52px);
      }
    }
  `]
})
export class AppComponent { }
