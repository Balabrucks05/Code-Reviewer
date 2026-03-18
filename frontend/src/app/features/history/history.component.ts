import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="history-header">
        <h2>Analysis History</h2>
        <a routerLink="/analyzer" class="btn btn-primary">New Analysis</a>
      </div>
      <div class="history-empty" *ngIf="analyses.length === 0">
        <p class="text-secondary">No analyses yet. Start by analyzing a contract.</p>
        <a routerLink="/analyzer" class="btn btn-secondary">Analyze Contract</a>
      </div>
      <div class="history-list" *ngIf="analyses.length > 0">
        <div class="card" *ngFor="let analysis of analyses">
          <div class="card-body">
            <p>{{ analysis.id }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-8) 0 var(--space-6);
    }
    .history-empty {
      text-align: center;
      padding: var(--space-16);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      align-items: center;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  `],
})
export class HistoryComponent implements OnInit {
  analyses: Array<{ id: string }> = [];

  ngOnInit() {
    const stored = localStorage.getItem('analysis-history');
    if (stored) {
      this.analyses = JSON.parse(stored);
    }
  }
}
