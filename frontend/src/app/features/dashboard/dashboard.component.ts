import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalysisService, SampleContract } from '../../core/services/analysis.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard fade-in">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="gradient-text">AI-Powered</span> Smart Contract
            <br>Security Platform
          </h1>
          
          <button class="theme-toggle btn btn-ghost" (click)="toggleTheme()" [title]="'Current theme: ' + themeService.preference()">
            @if (themeService.preference() === 'light') {
                <!-- Sun Icon -->
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                </svg>
            } @else if (themeService.preference() === 'dark') {
                <!-- Moon Icon -->
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            } @else {
                <!-- System Icon -->
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M8 21h8M12 17v4"></path>
                </svg>
            }
          </button>
          <p class="hero-subtitle">
            Comprehensive security auditing, gas optimization, and code review
            powered by advanced static analysis and AI reasoning.
          </p>
          <div class="hero-actions">
            <a routerLink="/analyze" class="btn btn-primary btn-lg glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"/>
              </svg>
              Start New Audit
            </a>
            <a href="#samples" class="btn btn-secondary btn-lg">
              Try Sample Contracts
            </a>
          </div>
        </div>
        
        <div class="hero-visual">
          <div class="code-preview glass">
            <div class="code-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
              <span class="filename">VulnerableContract.sol</span>
            </div>
            <pre class="code-content"><code>{{ animatedCode() }}</code></pre>
            <div class="scan-line"></div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="features stagger">
        <div class="feature-card card glow">
          <div class="feature-icon security">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h3>Security Audit</h3>
          <p>Detect reentrancy, access control issues, and upgradeability risks with line-level precision.</p>
          <div class="feature-stats">
            <span class="stat">
              <strong>5+</strong> Detection Rules
            </span>
          </div>
        </div>

        <div class="feature-card card glow">
          <div class="feature-icon gas">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h3>Gas Optimization</h3>
          <p>Identify storage inefficiencies, optimize loops, and reduce bytecode size.</p>
          <div class="feature-stats">
            <span class="stat">
              <strong>~30%</strong> Avg Savings
            </span>
          </div>
        </div>

        <div class="feature-card card glow">
          <div class="feature-icon ai">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <h3>AI Code Review</h3>
          <p>Get intelligent suggestions on architecture, naming, and best practices.</p>
          <div class="feature-stats">
            <span class="stat">
              <strong>GPT-4</strong> Powered
            </span>
          </div>
        </div>
      </section>

      <!-- Sample Contracts -->
      <section id="samples" class="samples">
        <div class="section-header">
          <h2>Try Sample Contracts</h2>
          <p>Test the platform with pre-built examples showcasing different vulnerability types.</p>
        </div>
        
        @if (samples().length > 0) {
          <div class="samples-grid stagger">
            @for (sample of samples(); track sample.name) {
              <div class="sample-card card" (click)="selectSample(sample)">
                <div class="sample-header">
                  <div class="sample-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <h4>{{ sample.name }}</h4>
                </div>
                <p>{{ sample.description }}</p>
                <code class="sample-filename">{{ sample.filename }}</code>
              </div>
            }
          </div>
        } @else {
          <div class="samples-loading">
            <div class="spinner"></div>
            <span>Loading samples...</span>
          </div>
        }
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <div class="stat-item">
          <div class="stat-value gradient-text">24KB</div>
          <div class="stat-label">Max Contract Size</div>
        </div>
        <div class="stat-item">
          <div class="stat-value gradient-text">&lt;5s</div>
          <div class="stat-label">Avg Analysis Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value gradient-text">100+</div>
          <div class="stat-label">Gas Patterns</div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-12);
      align-items: center;
      min-height: 60vh;
      padding: var(--space-8) 0;
      position: relative;
    }
    
    .theme-toggle {
        position: absolute;
        top: var(--space-4);
        right: 0;
        z-index: 10;
        padding: var(--space-2);
        border-radius: var(--radius-full);
        color: var(--color-text-muted);
    }
    
    .theme-toggle:hover {
        color: var(--color-text-primary);
        background: var(--color-bg-elevated);
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: var(--space-5);
    }

    .gradient-text {
      background: var(--gradient-neon);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-8);
      line-height: 1.7;
    }

    .hero-actions {
      display: flex;
      gap: var(--space-4);
    }

    .btn-lg {
      padding: var(--space-4) var(--space-6);
      font-size: 1rem;
    }

    /* Code Preview */
    .hero-visual {
      position: relative;
    }

    .code-preview {
      border-radius: var(--radius-lg);
      overflow: hidden;
      position: relative;
    }

    .code-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: rgba(0, 0, 0, 0.3);
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .dot.red { background: #ef4444; }
    .dot.yellow { background: #eab308; }
    .dot.green { background: #22c55e; }

    .filename {
      margin-left: var(--space-3);
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-family: var(--font-mono);
    }

    .code-content {
      padding: var(--space-4);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.6;
      color: var(--color-text-secondary);
      margin: 0;
      min-height: 200px;
      overflow: hidden;
    }

    .scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--gradient-neon);
      box-shadow: var(--shadow-neon);
      animation: scan 3s linear infinite;
    }

    @keyframes scan {
      0% { top: 40px; opacity: 1; }
      50% { opacity: 0.5; }
      100% { top: calc(100% - 2px); opacity: 1; }
    }

    /* Features */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-6);
      padding: var(--space-12) 0;
    }

    .feature-card {
      padding: var(--space-6);
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-4);
    }

    .feature-icon.security {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1));
      color: var(--color-neon-green);
    }

    .feature-icon.gas {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 179, 8, 0.1));
      color: var(--color-neon-orange);
    }

    .feature-icon.ai {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
      color: var(--color-accent-primary);
    }

    .feature-card h3 {
      margin-bottom: var(--space-2);
      font-size: 1.25rem;
    }

    .feature-card p {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: var(--space-4);
    }

    .feature-stats {
      display: flex;
      gap: var(--space-4);
    }

    .stat {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .stat strong {
      color: var(--color-accent-primary);
    }

    /* Samples */
    .samples {
      padding: var(--space-12) 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .section-header h2 {
      font-size: 2rem;
      margin-bottom: var(--space-3);
    }

    .section-header p {
      color: var(--color-text-secondary);
    }

    .samples-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-5);
    }

    .sample-card {
      padding: var(--space-5);
      cursor: pointer;
      transition: all 0.3s var(--ease-out-expo);
    }

    .sample-card:hover {
      border-color: var(--color-accent-primary);
      transform: translateY(-4px) scale(1.02);
    }

    .sample-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .sample-icon {
      width: 36px;
      height: 36px;
      background: var(--gradient-primary);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .sample-card h4 {
      font-size: 1rem;
    }

    .sample-card p {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-bottom: var(--space-3);
    }

    .sample-filename {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      background: var(--color-bg-tertiary);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .samples-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-8);
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

    /* Stats Section */
    .stats-section {
      display: flex;
      justify-content: center;
      gap: var(--space-16);
      padding: var(--space-12) 0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: var(--space-2);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    @media (max-width: 1024px) {
      .hero {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .hero-actions {
        justify-content: center;
      }

      .hero-visual {
        display: none;
      }

      .features {
        grid-template-columns: 1fr;
      }

      .stats-section {
        flex-direction: column;
        gap: var(--space-6);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  samples = signal<SampleContract[]>([]);

  // Animated code typing effect
  private fullCode = `pragma solidity ^0.8.20;

contract VulnerableBank {
  mapping(address => uint256) balances;

  function withdraw(uint amount) external {
    require(balances[msg.sender] >= amount);
    
    // Reentrancy vulnerability!
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    
    balances[msg.sender] -= amount;
  }
}`;

  private codeIndex = signal(0);
  animatedCode = computed(() => this.fullCode.substring(0, this.codeIndex()));

  constructor(
    private analysisService: AnalysisService,
    public themeService: ThemeService
  ) { }

  toggleTheme() {
    const current = this.themeService.preference();
    if (current === 'system') this.themeService.setTheme('light');
    else if (current === 'light') this.themeService.setTheme('dark');
    else this.themeService.setTheme('system');
  }

  ngOnInit() {
    this.loadSamples();
    this.animateCode();
  }

  private loadSamples() {
    this.analysisService.getSampleContracts().subscribe({
      next: (samples) => this.samples.set(samples),
      error: () => console.log('Could not load samples - backend may not be running')
    });
  }

  private animateCode() {
    const interval = setInterval(() => {
      if (this.codeIndex() < this.fullCode.length) {
        this.codeIndex.update(i => i + 1);
      } else {
        clearInterval(interval);
      }
    }, 20);
  }

  selectSample(sample: SampleContract) {
    // Navigate to analyzer with sample pre-loaded
    sessionStorage.setItem('selectedSample', JSON.stringify(sample));
    window.location.href = '/analyze';
  }
}
