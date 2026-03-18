import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-analyzer',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="analyzer-header">
        <h2>Analyze Smart Contract</h2>
        <p class="text-secondary">Paste your Solidity code below to start the analysis</p>
      </div>
      <div class="analyzer-body">
        <textarea
          [(ngModel)]="contractCode"
          placeholder="// Paste your Solidity contract here..."
          class="code-editor font-mono"
          rows="20"
        ></textarea>
        <button
          class="btn btn-primary"
          (click)="analyze()"
          [disabled]="!contractCode || isLoading"
        >
          {{ isLoading ? 'Analyzing...' : 'Analyze Contract' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .analyzer-header {
      padding: var(--space-8) 0 var(--space-6);
    }
    .analyzer-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .code-editor {
      width: 100%;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      font-size: 0.875rem;
      resize: vertical;
    }
  `],
})
export class AnalyzerComponent {
  contractCode = '';
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  analyze() {
    if (!this.contractCode) return;
    this.isLoading = true;
    const payload = {
      contracts: [{ filename: 'Contract.sol', content: this.contractCode }],
      options: {
        enableSecurityAudit: true,
        enableGasOptimization: true,
        enableAiReview: true,
      },
    };
    this.http.post<{ id: string }>('/api/analysis', payload).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.router.navigate(['/results', result.id]);
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
