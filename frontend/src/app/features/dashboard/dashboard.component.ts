import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="dashboard-header">
        <h1>ContractGuard</h1>
        <p class="text-secondary">AI-powered smart contract security auditing</p>
      </div>
      <div class="dashboard-actions">
        <a routerLink="/analyzer" class="btn btn-primary">
          Analyze Contract
        </a>
        <a routerLink="/history" class="btn btn-secondary">
          View History
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      padding: var(--space-16) 0 var(--space-8);
      text-align: center;
    }
    .dashboard-actions {
      display: flex;
      gap: var(--space-4);
      justify-content: center;
      flex-wrap: wrap;
    }
  `],
})
export class DashboardComponent {}
