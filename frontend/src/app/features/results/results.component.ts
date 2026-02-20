import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalysisService, AnalysisResult, SecurityIssue, GasOptimization, AiReviewComment } from '../../core/services/analysis.service';
import gsap from 'gsap';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [],
  template: `
    <div class="results">
      @if (result()) {
        @if (result()!.success === false && result()!.compilationErrors?.length) {
          <!-- Compilation Error State -->
          <div class="error-container">
            <div class="error-header">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <h1>Compilation Failed</h1>
              <p>Your contract could not be compiled. Please fix the errors below and try again.</p>
            </div>
            
            <div class="errors-list">
              @for (error of result()!.compilationErrors; track $index) {
                <div class="error-card">
                  <div class="error-type">
                    <span class="badge badge-critical">{{ error.type || 'Error' }}</span>
                  </div>
                  <p class="error-message">{{ error.message }}</p>
                  @if (error.suggestion) {
                    <div class="error-suggestion">
                      <strong>💡 Suggestion:</strong>
                      <p>{{ error.suggestion }}</p>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="error-actions">
              <button class="btn btn-primary" (click)="goBack()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Contract
              </button>
            </div>
          </div>
        } @else {
        <!-- Header with Scores -->
        <header class="results-header" #resultsHeader>
          <div class="header-info">
            <button class="back-btn btn btn-ghost" (click)="goBack()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div class="title-group">
              <h1>Analysis <span class="gradient-text-animated">Results</span></h1>
              <span class="timestamp">{{ formatDate(result()!.timestamp) }}</span>
            </div>
          </div>
          
          <div class="scores-grid" #scoresGrid>
            <div class="score-card" [class.critical]="result()!.overallScore < 50">
              <div class="score-ring-container">
                <svg class="score-ring" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#6366f1"/>
                      <stop offset="100%" stop-color="#22d3ee"/>
                    </linearGradient>
                  </defs>
                  <circle class="score-ring-bg" cx="60" cy="60" r="52"/>
                  <circle 
                    class="score-ring-progress" 
                    cx="60" cy="60" r="52"
                    [style.stroke-dasharray]="circumference"
                    [style.stroke-dashoffset]="getOffset(result()!.overallScore)"
                  />
                </svg>
                <div class="score-value counter" #scoreVal>0</div>
              </div>
              <div class="score-label">Overall Score</div>
            </div>

            <div class="score-card mini">
              <div class="mini-score security">
                <span class="value">{{ result()!.securityScore }}</span>
                <span class="label">Security</span>
              </div>
            </div>

            <div class="score-card mini">
              <div class="mini-score gas">
                <span class="value">{{ result()!.gasScore }}</span>
                <span class="label">Gas</span>
              </div>
            </div>

            <div class="score-card mini">
              <div class="mini-score quality">
                <span class="value">{{ result()!.codeQualityScore }}</span>
                <span class="label">Quality</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Summary Cards -->
        <section class="summary-section" #summarySection>
          <div class="summary-cards">
            <div class="summary-card critical-card" [class.has-issues]="result()!.summary.criticalCount > 0">
              <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg></div>
              <div class="card-value">{{ result()!.summary.criticalCount }}</div>
              <div class="card-label">Critical</div>
            </div>
            <div class="summary-card high-card" [class.has-issues]="result()!.summary.highCount > 0">
              <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2M12 15h.01M12 2a10 10 0 1010 10A10 10 0 0012 2z"/></svg></div>
              <div class="card-value">{{ result()!.summary.highCount }}</div>
              <div class="card-label">High</div>
            </div>
            <div class="summary-card medium-card" [class.has-issues]="result()!.summary.mediumCount > 0">
              <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
              <div class="card-value">{{ result()!.summary.mediumCount }}</div>
              <div class="card-label">Medium</div>
            </div>
            <div class="summary-card low-card" [class.has-issues]="result()!.summary.lowCount > 0">
              <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
              <div class="card-value">{{ result()!.summary.lowCount }}</div>
              <div class="card-label">Low</div>
            </div>
            <div class="summary-card opt-card">
              <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
              <div class="card-value">{{ result()!.summary.optimizationOpportunities }}</div>
              <div class="card-label">Optimizations</div>
            </div>
          </div>
        </section>

        <!-- Tab Navigation -->
        <nav class="tabs-nav" #tabsNav>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'security'"
            (click)="activeTab.set('security')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Security Issues
            <span class="tab-count">{{ securityIssues().length }}</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'gas'"
            (click)="activeTab.set('gas')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Gas Optimizations
            <span class="tab-count">{{ gasOptimizations().length }}</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'ai'"
            (click)="activeTab.set('ai')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
            </svg>
            AI Review
            <span class="tab-count">{{ aiComments().length }}</span>
          </button>
        </nav>

        <!-- Tab Content -->
        <div class="tab-content">
          @if (activeTab() === 'security') {
            <div class="issues-list stagger">
              @for (issue of securityIssues(); track issue.id) {
                <div class="issue-card card" [class]="'severity-' + issue.severity">
                  <div class="issue-header">
                    <span class="badge" [class]="'badge-' + issue.severity">{{ issue.severity }}</span>
                    <h4>{{ issue.title }}</h4>
                    <span class="issue-location">Line {{ issue.location.startLine }}</span>
                  </div>
                  <p class="issue-description">{{ issue.description }}</p>
                  @if (issue.codeSnippet) {
                    <pre class="code-snippet"><code>{{ issue.codeSnippet }}</code></pre>
                  }
                  <div class="issue-recommendation">
                    <strong>Recommendation:</strong>
                    <p>{{ issue.recommendation }}</p>
                  </div>
                  @if (issue.fixExample) {
                    <details class="fix-example">
                      <summary>View Fix Example</summary>
                      <pre><code>{{ issue.fixExample }}</code></pre>
                    </details>
                  }
                </div>
              } @empty {
                <div class="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  <h4>No Security Issues Found</h4>
                  <p>Your contract passed all security checks!</p>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'gas') {
            <div class="issues-list stagger">
              @for (opt of gasOptimizations(); track opt.id) {
                <div class="issue-card card gas-card">
                  <div class="issue-header">
                    <span class="badge" [class]="'badge-' + opt.impact">{{ opt.impact }} impact</span>
                    <h4>{{ opt.title }}</h4>
                    <span class="gas-saving">~{{ opt.estimatedGasSaving }} gas</span>
                  </div>
                  <p class="issue-description">{{ opt.description }}</p>
                  <div class="code-comparison">
                    <div class="code-before">
                      <span class="label">Current</span>
                      <pre><code>{{ opt.currentCode }}</code></pre>
                    </div>
                    <div class="code-arrow">→</div>
                    <div class="code-after">
                      <span class="label">Suggested</span>
                      <pre><code>{{ opt.suggestedCode }}</code></pre>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  <h4>Highly Optimized!</h4>
                  <p>No significant gas optimizations found.</p>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'ai') {
            <div class="issues-list stagger">
              @for (comment of aiComments(); track comment.id) {
                <div class="issue-card card ai-card">
                  <div class="issue-header">
                    <span class="badge badge-category">{{ comment.category }}</span>
                    <h4>{{ comment.title }}</h4>
                    <span class="priority-badge" [class]="'priority-' + comment.priority">{{ comment.priority }}</span>
                  </div>
                  <div class="ai-reasoning">
                    <strong>Reasoning:</strong>
                    <p>{{ comment.reasoning }}</p>
                  </div>
                  <div class="ai-suggestion">
                    <strong>Suggestion:</strong>
                    <p>{{ comment.suggestion }}</p>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                  <h4>Great Code Quality!</h4>
                  <p>No additional recommendations from AI review.</p>
                </div>
              }
            </div>
          }
        </div>
        }
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading results...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .results {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Compilation Error State */
    .error-container {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--space-8);
    }

    .error-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .error-header svg {
      color: var(--color-critical);
      margin-bottom: var(--space-4);
    }

    .error-header h1 {
      color: var(--color-critical);
      margin-bottom: var(--space-2);
    }

    .error-header p {
      color: var(--color-text-secondary);
    }

    .errors-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .error-card {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-left: 3px solid var(--color-critical);
      padding: var(--space-5);
      border-radius: var(--radius-md);
    }

    .error-type {
      margin-bottom: var(--space-2);
    }

    .error-message {
      font-family: var(--font-mono);
      font-size: 0.875rem;
      color: var(--color-text-primary);
      word-break: break-word;
    }

    .error-suggestion {
      margin-top: var(--space-4);
      padding: var(--space-3);
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: var(--radius-sm);
    }

    .error-suggestion strong {
      color: var(--color-neon-green);
    }

    .error-actions {
      text-align: center;
    }

    /* Header */
    .results-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
      gap: var(--space-6);
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .back-btn {
      align-self: flex-start;
    }

    .title-group h1 {
      margin-bottom: var(--space-1);
    }

    .timestamp {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    /* Scores */
    .scores-grid {
      display: flex;
      gap: var(--space-4);
      align-items: center;
    }

    .score-card {
      text-align: center;
    }

    .score-ring-container {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .score-ring {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .score-ring-bg {
      fill: none;
      stroke: var(--color-bg-tertiary);
      stroke-width: 8;
    }

    .score-ring-progress {
      fill: none;
      stroke: url(#scoreGradient);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 1.5s var(--ease-out-expo);
      filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.4));
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2rem;
      font-weight: 700;
    }

    .score-label {
      margin-top: var(--space-2);
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .score-card.mini {
      background: var(--color-bg-secondary);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-subtle);
    }

    .mini-score {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .mini-score .value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .mini-score .label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .mini-score.security .value { color: var(--color-neon-green); }
    .mini-score.gas .value { color: var(--color-neon-orange); }
    .mini-score.quality .value { color: var(--color-neon-cyan); }

    /* Summary Cards */
    .summary-cards {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .summary-card {
      flex: 1;
      background: var(--color-bg-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      text-align: center;
      border: 1px solid var(--color-border-subtle);
      transition: all 0.4s var(--ease-out-expo);
    }

    .summary-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .summary-card.has-issues {
      border-color: rgba(239, 68, 68, 0.3);
    }

    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-3);
      opacity: 0.6;
    }

    .critical-card .card-icon { background: rgba(239, 68, 68, 0.1); color: var(--color-critical); }
    .high-card .card-icon { background: rgba(249, 115, 22, 0.1); color: var(--color-high); }
    .medium-card .card-icon { background: rgba(234, 179, 8, 0.1); color: var(--color-medium); }
    .low-card .card-icon { background: rgba(34, 197, 94, 0.1); color: var(--color-low); }
    .opt-card .card-icon { background: rgba(59, 130, 246, 0.1); color: var(--color-info); }

    .card-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .critical-card.has-issues .card-value { color: var(--color-critical); }
    .high-card.has-issues .card-value { color: var(--color-high); }
    .medium-card.has-issues .card-value { color: var(--color-medium); }

    .card-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: var(--space-2);
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border-subtle);
      padding-bottom: var(--space-2);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s var(--ease-out-expo);
    }

    .tab-btn:hover {
      background: var(--color-fill-subtle);
      color: var(--color-text-primary);
      transform: translateY(-1px);
    }

    .tab-btn.active {
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-accent-primary);
    }

    .tab-count {
      background: var(--color-bg-tertiary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
    }

    .tab-btn.active .tab-count {
      background: rgba(99, 102, 241, 0.2);
    }

    /* Issues List */
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .issue-card {
      padding: var(--space-5);
      transition: transform 0.3s var(--ease-out-expo);
    }

    .issue-card:hover {
      transform: translateX(4px);
    }

    .issue-card.severity-critical { border-left: 3px solid var(--color-critical); }
    .issue-card.severity-high { border-left: 3px solid var(--color-high); }
    .issue-card.severity-medium { border-left: 3px solid var(--color-medium); }
    .issue-card.severity-low { border-left: 3px solid var(--color-low); }

    .issue-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      flex-wrap: wrap;
    }

    .issue-header h4 {
      flex: 1;
      font-size: 1rem;
    }

    .issue-location, .gas-saving {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
    }

    .gas-saving {
      color: var(--color-neon-green);
    }

    .issue-description {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: var(--space-4);
    }

    .code-snippet {
      background: var(--color-bg-primary);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      overflow-x: auto;
      margin-bottom: var(--space-4);
    }

    .issue-recommendation {
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.1);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    .issue-recommendation strong {
      color: var(--color-neon-green);
    }

    .fix-example {
      margin-top: var(--space-3);
    }

    .fix-example summary {
      cursor: pointer;
      color: var(--color-accent-primary);
      font-size: 0.875rem;
    }

    .fix-example pre {
      margin-top: var(--space-2);
      background: var(--color-bg-primary);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      overflow-x: auto;
    }

    /* Code Comparison */
    .code-comparison {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: var(--space-3);
      align-items: start;
    }

    .code-before, .code-after {
      background: var(--color-bg-primary);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
    }

    .code-before { border: 1px solid rgba(239, 68, 68, 0.2); }
    .code-after { border: 1px solid rgba(34, 197, 94, 0.2); }

    .code-comparison .label {
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: var(--space-2);
    }

    .code-arrow {
      color: var(--color-accent-primary);
      font-size: 1.5rem;
      padding-top: var(--space-4);
    }

    /* AI Card */
    .ai-reasoning, .ai-suggestion {
      margin-bottom: var(--space-3);
      font-size: 0.875rem;
    }

    .ai-reasoning strong { color: var(--color-neon-cyan); }
    .ai-suggestion strong { color: var(--color-neon-green); }

    .priority-badge {
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      text-transform: uppercase;
    }

    .priority-required { background: rgba(239, 68, 68, 0.15); color: var(--color-critical); }
    .priority-recommended { background: rgba(234, 179, 8, 0.15); color: var(--color-medium); }
    .priority-optional { background: rgba(59, 130, 246, 0.15); color: var(--color-info); }

    .badge-category {
      background: rgba(139, 92, 246, 0.15);
      color: var(--color-accent-secondary);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12);
      color: var(--color-text-secondary);
    }

    .empty-state svg {
      margin-bottom: var(--space-4);
      color: var(--color-neon-green);
    }

    .empty-state h4 {
      margin-bottom: var(--space-2);
      color: var(--color-text-primary);
    }

    /* Loading */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-12);
      color: var(--color-text-secondary);
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-bg-tertiary);
      border-top-color: var(--color-accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
      .results { padding: 0 var(--space-4); }
      .results-header {
        flex-direction: column;
        gap: var(--space-4);
      }
      .scores-grid {
        flex-wrap: wrap;
        justify-content: center;
      }
      .summary-cards {
        flex-direction: column;
      }
      .code-comparison {
        grid-template-columns: 1fr;
      }
      .code-comparison .comparison-arrow {
        transform: rotate(90deg);
      }
      .tabs-nav {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .tabs-nav::-webkit-scrollbar { display: none; }
      .tab-btn {
        white-space: nowrap;
        padding: var(--space-2) var(--space-3);
        font-size: 0.8rem;
      }
      .issue-card, .gas-card, .ai-card {
        padding: var(--space-4);
      }
      .score-ring-container { width: 100px; }
      .score-ring-container svg { width: 100px; height: 100px; }
    }

    @media (max-width: 480px) {
      .results { padding: 0 var(--space-3); }
      .results-header h1 { font-size: 1.25rem; }
      .score-ring-container { width: 80px; }
      .score-ring-container svg { width: 80px; height: 80px; }
      .score-val { font-size: 1.25rem; }
      .score-card.mini { padding: var(--space-3); }
      .mini-score .value { font-size: 1.25rem; }
      .summary-card { padding: var(--space-4); }
      .tab-btn { font-size: 0; gap: 0; padding: var(--space-2); }
      .tab-btn svg { font-size: initial; }
      .tab-count { display: none; }
      .issue-card, .gas-card, .ai-card { padding: var(--space-3); }
      .error-container { padding: var(--space-4); }
    }
  `]
})
export class ResultsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('resultsHeader') resultsHeader!: ElementRef;
  @ViewChild('scoresGrid') scoresGrid!: ElementRef;
  @ViewChild('scoreVal') scoreValEl!: ElementRef;
  @ViewChild('summarySection') summarySection!: ElementRef;
  @ViewChild('tabsNav') tabsNav!: ElementRef;

  result = signal<AnalysisResult | null>(null);
  activeTab = signal<'security' | 'gas' | 'ai'>('security');

  circumference = 2 * Math.PI * 52;

  securityIssues = computed(() =>
    this.result()?.contracts.flatMap(c => c.securityIssues) || []
  );

  gasOptimizations = computed(() =>
    this.result()?.contracts.flatMap(c => c.gasOptimizations) || []
  );

  aiComments = computed(() =>
    this.result()?.contracts.flatMap(c => c.aiReviewComments) || []
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analysisService: AnalysisService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const cached = this.analysisService.currentAnalysis();
      if (cached?.id === id) {
        this.result.set(cached);
      } else {
        this.analysisService.getAnalysis(id).subscribe({
          next: (result) => this.result.set(result),
          error: () => this.router.navigate(['/dashboard'])
        });
      }
    }
  }

  ngAfterViewInit() {
    // Wait for result to load before animating
    setTimeout(() => this.runEntrance(), 100);
  }

  ngOnDestroy() {
    gsap.killTweensOf('*');
  }

  private runEntrance() {
    if (!this.resultsHeader?.nativeElement) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(this.resultsHeader.nativeElement, { opacity: 0, y: -30, duration: 0.6 });

    if (this.scoresGrid?.nativeElement) {
      const cards = this.scoresGrid.nativeElement.querySelectorAll('.score-card');
      tl.from(cards, { opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.5 }, '-=0.3');
    }

    // Animate score counter
    if (this.scoreValEl?.nativeElement && this.result()) {
      const target = this.result()!.overallScore;
      gsap.to({ val: 0 }, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function () {
          const el = document.querySelector('.score-value.counter') as HTMLElement;
          if (el) el.textContent = Math.round((this as any).targets()[0].val).toString();
        }
      });
    }

    if (this.summarySection?.nativeElement) {
      const summaryCards = this.summarySection.nativeElement.querySelectorAll('.summary-card');
      tl.from(summaryCards, { opacity: 0, y: 20, stagger: 0.08, duration: 0.5 }, '-=0.3');
    }

    if (this.tabsNav?.nativeElement) {
      tl.from(this.tabsNav.nativeElement, { opacity: 0, y: 15, duration: 0.4 }, '-=0.2');
    }
  }

  getOffset(score: number): number {
    return this.circumference - (score / 100) * this.circumference;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  goBack() {
    this.router.navigate(['/analyze']);
  }
}
