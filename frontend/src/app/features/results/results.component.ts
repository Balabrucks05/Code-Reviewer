import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import type { AnalysisResult } from '../../../../../shared/types';

@Component({
  selector: 'app-results',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="results-header">
        <a routerLink="/analyzer" class="btn btn-ghost">← New Analysis</a>
        <h2>Analysis Results</h2>
      </div>

      <div *ngIf="isLoading" class="loading">
        <div class="shimmer">Loading analysis...</div>
      </div>

      <div *ngIf="result && !isLoading" class="results-body">
        <!-- Scores -->
        <div class="scores-grid">
          <div class="score-card glass-premium">
            <div class="score-label">Security</div>
            <div class="score-value">{{ result.securityScore }}<span>/100</span></div>
          </div>
          <div class="score-card glass-premium">
            <div class="score-label">Gas Efficiency</div>
            <div class="score-value">{{ result.gasScore }}<span>/100</span></div>
          </div>
          <div class="score-card glass-premium">
            <div class="score-label">Code Quality</div>
            <div class="score-value">{{ result.codeQualityScore }}<span>/100</span></div>
          </div>
          <div class="score-card glass-premium">
            <div class="score-label">Overall</div>
            <div class="score-value">{{ result.overallScore }}<span>/100</span></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="card" *ngIf="result.summary">
          <div class="card-header"><h3>Summary</h3></div>
          <div class="card-body">
            <p>Total Issues: {{ result.summary.totalIssues }}</p>
            <p *ngIf="result.summary.criticalCount">Critical: {{ result.summary.criticalCount }}</p>
            <p *ngIf="result.summary.highCount">High: {{ result.summary.highCount }}</p>
            <p *ngIf="result.summary.mediumCount">Medium: {{ result.summary.mediumCount }}</p>
            <p *ngIf="result.summary.lowCount">Low: {{ result.summary.lowCount }}</p>
          </div>
        </div>

        <!-- Security Issues -->
        <div class="card" *ngFor="let contract of result.contracts">
          <div class="card-header">
            <h3>{{ contract.name }}</h3>
          </div>
          <div class="card-body">
            <div *ngFor="let issue of contract.securityIssues" class="issue-item">
              <span class="badge" [class]="'badge-' + issue.severity">{{ issue.severity }}</span>
              <strong>{{ issue.title }}</strong>
              <p class="text-secondary">{{ issue.description }}</p>
            </div>
            <p *ngIf="!contract.securityIssues?.length" class="text-secondary">
              No security issues found.
            </p>
          </div>
        </div>
      </div>

      <div *ngIf="error" class="error-state">
        <p>Failed to load results. <a routerLink="/analyzer">Try again</a></p>
      </div>
    </div>
  `,
  styles: [`
    .results-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-8) 0 var(--space-6);
    }
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    .score-card {
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      text-align: center;
    }
    .score-label {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: var(--space-2);
    }
    .score-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-accent-primary);
    }
    .score-value span {
      font-size: 1rem;
      color: var(--color-text-muted);
    }
    .results-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .issue-item {
      padding: var(--space-4) 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .loading, .error-state {
      text-align: center;
      padding: var(--space-16);
    }
  `],
})
export class ResultsComponent implements OnInit {
  result: AnalysisResult | null = null;
  isLoading = true;
  error = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<AnalysisResult>(`/api/analysis/${id}`).subscribe({
        next: (result) => {
          this.result = result;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = true;
        },
      });
    }
  }
}
