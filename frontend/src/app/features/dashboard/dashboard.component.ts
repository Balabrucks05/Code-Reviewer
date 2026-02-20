import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalysisService, SampleContract } from '../../core/services/analysis.service';
import { ThemeService } from '../../core/services/theme.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <!-- Particle Network Canvas -->
      <canvas #networkCanvas class="network-canvas"></canvas>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge glass-premium" #heroBadge>
            <span class="badge-dot"></span>
            <span>Powered by AI & Static Analysis</span>
          </div>
          <h1 class="hero-title" #heroTitle>
            <span class="word-line"><span class="word gradient-text-animated">AI-Powered</span> <span class="word">Smart</span> <span class="word">Contract</span></span>
            <span class="word-line"><span class="word">Security</span> <span class="word">Platform</span></span>
          </h1>
          
          <button class="theme-toggle btn btn-ghost" (click)="toggleTheme()" [title]="'Theme: ' + themeService.preference()">
            @if (themeService.preference() === 'light') {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
              </svg>
            } @else if (themeService.preference() === 'dark') {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            } @else {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M8 21h8M12 17v4"></path>
              </svg>
            }
          </button>

          <p class="hero-subtitle" #heroSub>
            Comprehensive security auditing, gas optimization, and code review
            powered by advanced static analysis and AI reasoning.
          </p>
          <div class="hero-actions" #heroActions>
            <a routerLink="/analyze" class="btn btn-primary btn-lg btn-liquid btn-magnetic glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Start New Audit
            </a>
            <a href="#samples" class="btn btn-secondary btn-lg btn-magnetic">
              Try Sample Contracts
            </a>
          </div>
        </div>
        
        <div class="hero-visual" #heroVisual>
          <!-- Security Score -->
          @if (simulationState() === 'complete') {
            <div class="security-score-card glass-premium scale-in">
              <div class="score-ring">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle class="score-ring-bg" cx="50" cy="50" r="45"></circle>
                  <circle class="score-ring-progress" cx="50" cy="50" r="45"
                          transform="rotate(-90 50 50)"
                          [style.stroke-dasharray]="283"
                          [style.stroke-dashoffset]="283 - (283 * score() / 100)"></circle>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#22d3ee"/>
                      <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="score-ring-value gradient-text-animated">{{ score() }}</div>
              </div>
              <div class="score-label">Security Score</div>
            </div>
          }

          <!-- Simulation Window -->
          <div class="code-preview glass-premium shine-effect">
            <!-- Window Bar -->
            <div class="code-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
              <div class="filename">{{ currentScenario().filename }}</div>
            </div>

            <!-- Code Content -->
            <div class="code-content-wrapper" [class.fade-out]="simulationState() === 'transition'">
              <div class="line-numbers">
                @for (line of codeLines(); track $index) {
                  <div>{{ $index + 1 }}</div>
                }
              </div>
              <pre class="code-content"><code>{{ animatedCode() }}<span class="cursor">|</span></code></pre>
              
              <!-- Vulnerability Overlays -->
              @if (simulationState() === 'analyzing' || simulationState() === 'complete') {
                @for (vuln of currentScenario().vulns; track vuln.line) {
                  <div class="vuln-line" 
                       [style.top.px]="(vuln.line * 20) + 12"
                       [class.vuln-critical]="vuln.type === 'critical'"
                       [class.vuln-high]="vuln.type === 'high'"
                       [class.vuln-info]="vuln.type === 'info'">
                  </div>
                }
              }

              @if (simulationState() === 'scanning') {
                <div class="scan-line"></div>
              }
            </div>

            <!-- Floating Badges -->
            @if (simulationState() === 'analyzing' || simulationState() === 'complete') {
              @for (vuln of currentScenario().vulns; track vuln.line) {
                 @if (vuln.type === 'critical' || vuln.type === 'high') {
                    <div class="floating-badge glass-premium float" 
                         [class.badge-critical]="vuln.type === 'critical'"
                         [class.badge-high]="vuln.type === 'high'"
                         [style.top.px]="(vuln.line * 20)">
                      <span class="badge-dot"></span> {{ vuln.message }}
                    </div>
                 }
              }
            }
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="process-section" #featuresSection>
        <div class="section-header">
           <h2 class="section-title text-balance">Enterprise-Grade <span class="gradient-text-animated">Security Pipeline</span></h2>
           <p>From code upload to final audit report in seconds.</p>
        </div>

        <div class="process-steps" #featuresTrack>
          @for (step of processSteps; track step.num) {
            <div class="process-card glass-premium mouse-light">
               <div class="process-number">{{ step.num }}</div>
               <h3>{{ step.title }}</h3>
               <p>{{ step.desc }}</p>
            </div>
            @if (!$last) {
              <div class="process-connector">
                <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
                  <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-dasharray="4 4"/>
                </svg>
              </div>
            }
          }
        </div>
      </section>

      <!-- Audit Report Preview -->
      <section class="report-preview-section">
        <div class="report-mockup glass-premium glow-border mouse-light">
           <div class="report-header">
              <div class="report-title-group">
                 <span class="report-icon">📄</span> 
                 <span class="report-id">Audit Report #8821</span>
                 <span class="badge badge-high glow-always">High Risk</span>
              </div>
              <div class="report-meta">0x71C...9A2 • Just now</div>
           </div>
           
           <div class="report-body">
              <div class="report-visuals">
                 <div class="severity-chart">
                    <!-- Circular severity distribution -->
                    <svg width="120" height="120" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                       <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-critical)" stroke-width="12" stroke-dasharray="60 251" transform="rotate(-90 50 50)"/>
                       <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-high)" stroke-width="12" stroke-dasharray="100 251" stroke-dashoffset="-60" transform="rotate(-90 50 50)"/>
                       <text x="50" y="55" text-anchor="middle" fill="white" font-size="20" font-weight="bold">85</text>
                    </svg>
                    <div class="chart-label">Security Score</div>
                 </div>
              </div>
              
              <div class="report-findings">
                 <div class="finding-row critical">
                    <div class="finding-icon-wrapper">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                       <h4>Reentrancy in withdraw()</h4>
                       <p>External call before state update allows re-entry.</p>
                    </div>
                 </div>
                 <div class="finding-row info">
                    <div class="finding-icon-wrapper">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                    <div>
                       <h4>Gas Optimization</h4>
                       <p>Cache array length in loops saves ~2100 gas.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <!-- Advanced Capabilities -->
      <section class="capabilities-section">
        <div class="section-header">
           <h2>Advanced <span class="gradient-text-animated">Technical Capabilities</span></h2>
           <p>Powered by state-of-the-art static analysis and AI reasoning.</p>
        </div>
        
        <div class="capabilities-grid">
           @for (cap of capabilities; track cap.title) {
             <div class="cap-card glass-premium mouse-light">
                <div class="cap-icon glow">
                   <!-- Icon placeholder based on type -->
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (cap.icon === 'code') { <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/> }
                      @if (cap.icon === 'shield') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
                      @if (cap.icon === 'cpu') { <rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/> }
                      @if (cap.icon === 'lock') { <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/> }
                      @if (cap.icon === 'zap') { <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/> }
                      @if (cap.icon === 'layers') { <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/> }
                   </svg>
                </div>
                <div>
                  <h4>{{ cap.title }}</h4>
                  <p>{{ cap.desc }}</p>
                </div>
             </div>
           }
        </div>
      </section>

      <!-- Horizontal Divider -->
      <div class="section-divider"></div>

      <!-- Sample Contracts -->
      <section id="samples" class="samples" #samplesSection>
        <div class="section-header">
           <h2>Try <span class="gradient-text-animated">Sample Contracts</span></h2>
           <p>Explore real-world vulnerabilities and see how we detect them.</p>
        </div>

        @if (samples().length > 0) {
          <div class="samples-track" #samplesTrack>
            @for (sample of samples(); track sample.id) {
              <div class="sample-card glass-premium glow-border" (click)="selectSample(sample)">
                 <div class="sample-header">
                   <div class="sample-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                   </div>
                   <div class="sample-info">
                      <h4>{{ sample.name }}</h4>
                      <span class="sample-difficulty" [class.easy]="sample.difficulty === 'Easy'" 
                            [class.medium]="sample.difficulty === 'Medium'" 
                            [class.hard]="sample.difficulty === 'Hard'">
                        {{ sample.difficulty }}
                      </span>
                   </div>
                 </div>
                 
                 <div class="code-preview sample-preview-window">
                   <!-- Window Bar -->
                   <div class="code-header">
                     <span class="dot red"></span>
                     <span class="dot yellow"></span>
                     <span class="dot green"></span>
                     <div class="filename">{{ sample.filename }}</div>
                   </div>
                   <!-- Code Content -->
                   <div class="code-content-wrapper p-3" style="position: relative;">
                     <pre class="code-content sample-code"><code>contract {{ sample.name.split('.')[0] }} {{ '{' }}
  function execute() external {{ '{' }}
    <span class="sample-vuln-highlight">// ... vulnerability ...</span>
  {{ '}' }}
{{ '}' }}</code></pre>
                     <div class="sample-scanner"></div>
                   </div>
                 </div>

                 <button class="btn-sample-action">Run Audit</button>
              </div>
            }
          </div>
        } @else {
          <div class="samples-loading">
            <span class="loader"></span> Loading samples...
          </div>
        }
      </section>

      <!-- Stats Section -->
      <section class="stats-section" #statsSection>
        <div class="stat-item">
          <div class="stat-value gradient-text-animated counter" #counterEl>24KB</div>
          <div class="stat-label">Max Contract Size</div>
        </div>
        <div class="stat-item">
          <div class="stat-value gradient-text-animated counter" #counterEl>&lt;5s</div>
          <div class="stat-label">Avg Analysis Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value gradient-text-animated counter" #counterEl>100+</div>
          <div class="stat-label">Gas Patterns</div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }

    /* === Particle Network Canvas === */
    .network-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
      opacity: 0.6;
    }

    /* === Hero Section === */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-12);
      align-items: center;
      min-height: 80vh;
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

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-6);
      opacity: 0;
      transform: translateY(20px);
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-neon-green);
      box-shadow: 0 0 8px var(--color-neon-green);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    .hero-title {
      font-size: clamp(2.8rem, 5vw, 4.2rem);
      font-weight: 700;
      line-height: 1.05;
      margin-bottom: var(--space-5);
      opacity: 1;
      transform: none;
    }

    /* Word-by-word reveal animation */
    .word-line {
      display: block;
      overflow: hidden;
      padding-bottom: 6px;
    }

    .word {
      display: inline-block;
      margin-right: 0.25em;
      transform: translateY(120%);
      opacity: 0;
      will-change: transform, opacity;
    }
    .word:last-child {
      margin-right: 0;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-8);
      line-height: 1.7;
      opacity: 0;
      transform: translateY(20px);
    }

    .hero-actions {
      display: flex;
      gap: var(--space-4);
      opacity: 0;
      transform: translateY(20px);
    }

    .btn-lg {
      padding: var(--space-4) var(--space-6);
      font-size: 1rem;
    }

    /* === Code Preview === */
    .hero-visual {
      position: relative;
      opacity: 0;
      transform: translateX(40px);
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
      background: var(--editor-header-bg);
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

    /* Floating Badge */
    .floating-badge {
      position: absolute;
      top: -20px;
      right: 30px;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.8rem;
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.1);
      backdrop-filter: blur(10px);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    }

    /* Score Card */
    .security-score-card {
      position: absolute;
      bottom: -30px;
      left: -30px;
      padding: 16px;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      z-index: 10;
      width: 140px;
    }

    .score-ring { width: 80px; height: 80px; position: relative; }
    .score-ring svg { width: 100%; height: 100%; }
    .score-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .score-ring-value { font-size: 1.5rem; }

    /* Vuln Lines */
    .vuln-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 20px;
      background: rgba(239, 68, 68, 0.15);
      border-left: 3px solid var(--color-critical);
      pointer-events: none;
      animation: fade-in 0.5s forwards;
    }
    .vuln-high { border-color: var(--color-high); background: rgba(249, 115, 22, 0.15); }
    .vuln-info { border-color: var(--color-info); background: rgba(59, 130, 246, 0.15); }

    .code-content-wrapper { 
      position: relative; 
      padding: var(--space-4);
      display: flex;
      gap: var(--space-4);
    }
    .line-numbers {
      display: flex;
      flex-direction: column;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 20px;
      color: var(--color-text-muted);
      text-align: right;
      user-select: none;
      padding-right: var(--space-4);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
    .code-content { 
      padding: 0 !important; 
      line-height: 20px !important; 
      margin: 0; 
      font-size: 0.85rem; 
      min-height: 240px; 
      flex: 1;
      overflow-x: auto;
    }

    /* === Process & Capabilities === */
    .process-section { padding: var(--space-12) 0; }
    
    .process-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-top: var(--space-8);
    }
    
    .process-card {
      flex: 1;
      padding: var(--space-6);
      border-radius: var(--radius-lg);
      text-align: center;
      position: relative;
      transition: transform 0.3s var(--ease-out-expo);
    }
    .process-card:hover { transform: translateY(-5px); }
    
    .process-number {
      font-size: 3rem;
      font-weight: 800;
      color: var(--color-accent-primary);
      opacity: 0.2;
      margin-bottom: var(--space-2);
      font-family: var(--font-heading);
    }
    
    .process-connector {
      flex: 0 0 50px;
      opacity: 0.3;
    }
    
    .capabilities-section { padding: var(--space-12) 0; }
    
    .capabilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-5);
    }
    
    .cap-card {
      padding: var(--space-5);
      border-radius: var(--radius-lg);
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
      transition: all 0.3s var(--ease-out-expo);
    }
    .cap-card:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: var(--color-accent-primary);
    }
    
    .cap-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--color-bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-accent-primary);
      flex-shrink: 0;
    }
    
    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-border-subtle), transparent);
      width: 80%;
      margin: 0 auto;
    }

    /* === Report Preview === */
    .report-preview-section {
      padding: var(--space-8) 0;
      display: flex;
      justify-content: center;
    }

    .report-mockup {
      width: 100%;
      max-width: 800px;
      padding: var(--space-8);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(18, 18, 26, 0.8), rgba(18, 18, 26, 0.4));
      position: relative;
      overflow: hidden;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .report-title-group {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
    }

    .report-meta { color: var(--color-text-secondary); font-size: 0.875rem; font-family: var(--font-mono); }
    
    .report-body {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-8);
      align-items: center;
    }

    .report-visuals {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .chart-label { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-2); }

    .report-findings {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .finding-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      transition: all 0.3s var(--ease-out-expo);
    }
    .finding-row:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(4px);
    }
    .finding-row.critical { border-left: 3px solid var(--color-critical); }
    .finding-row.info { border-left: 3px solid var(--color-info); }

    .finding-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-primary);
    }
    .finding-row.critical .finding-icon-wrapper { color: var(--color-critical); background: rgba(239, 68, 68, 0.15); }
    .finding-row.info .finding-icon-wrapper { color: var(--color-info); background: rgba(59, 130, 246, 0.15); }

    .finding-row h4 { font-size: 1rem; margin-bottom: 2px; }
    .finding-row p { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; }

    /* === Report Preview === */
    .report-preview-section {
      padding: var(--space-8) 0;
      display: flex;
      justify-content: center;
    }

    .report-mockup {
      width: 100%;
      max-width: 800px;
      padding: var(--space-8);
      border-radius: var(--radius-xl);
      background: linear-gradient(145deg, rgba(18, 18, 26, 0.8), rgba(18, 18, 26, 0.4));
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08); /* Fallback */
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .report-title-group {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
    }

    .report-meta { color: var(--color-text-secondary); font-size: 0.875rem; font-family: var(--font-mono); }
    
    .report-body {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-8);
      align-items: center;
    }

    .report-visuals {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .chart-label { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-2); }

    .report-findings {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .finding-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      transition: all 0.3s var(--ease-out-expo);
    }
    .finding-row:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(4px);
    }
    .finding-row.critical { border-left: 3px solid var(--color-critical); }
    .finding-row.info { border-left: 3px solid var(--color-info); }

    .finding-icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-primary);
    }
    .finding-row.critical .finding-icon-wrapper { color: var(--color-critical); background: rgba(239, 68, 68, 0.15); }
    .finding-row.info .finding-icon-wrapper { color: var(--color-info); background: rgba(59, 130, 246, 0.15); }

    .finding-row h4 { font-size: 1rem; margin-bottom: 2px; }
    .finding-row p { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; }
    
    @media (max-width: 768px) {
      .report-body { grid-template-columns: 1fr; }
      .process-steps { flex-direction: column; }
      .process-connector { display: none; } /* or transform to vertical line */
      .capabilities-grid { grid-template-columns: 1fr; }
    }

    /* === Sample Contracts === */
    .samples { padding: var(--space-8) 0; }
    .samples-track {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .sample-card {
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      height: 100%;
    }
    .sample-card:hover {
      transform: translateY(-6px);
      border-color: var(--color-accent-primary);
      box-shadow: 0 15px 30px -10px rgba(99, 102, 241, 0.3);
    }
    .sample-header {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }
    .sample-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .sample-icon svg { width: 18px; height: 18px; }
    .sample-info h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .sample-difficulty {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sample-difficulty.easy { color: var(--color-low); background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); }
    .sample-difficulty.medium { color: var(--color-medium); background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); }
    .sample-difficulty.hard { color: var(--color-high); background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); }
    .sample-preview-window {
      border: 1px solid var(--color-border-subtle);
      background: var(--editor-bg);
      border-radius: var(--radius-md);
      overflow: hidden;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .sample-preview-window .code-header {
      padding: var(--space-2) var(--space-3);
    }
    .sample-preview-window .filename {
      font-size: 0.70rem;
    }
    .sample-preview-window .code-content-wrapper.p-3 {
      padding: var(--space-3);
      flex: 1;
      display: flex;
    }
    .sample-code {
      font-size: 0.75rem !important;
      line-height: 1.5 !important;
      min-height: auto !important;
      color: var(--color-text-secondary);
      background: transparent;
      padding: 0;
      margin: 0;
      position: relative;
      z-index: 2;
    }
    
    /* Mock Scanner Animation for Sample Cards */
    .sample-scanner {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--gradient-neon);
      box-shadow: var(--shadow-neon);
      opacity: 0;
      z-index: 3;
      pointer-events: none;
      animation: sample-scan 6s ease-in-out infinite;
    }
    .sample-vuln-highlight {
      display: inline-block;
      width: 100%;
      border-radius: 2px;
      animation: sample-vuln-flash 6s ease-in-out infinite;
    }
    @keyframes sample-scan {
      0%, 10% { top: 0; opacity: 0; }
      15% { opacity: 1; }
      40% { top: 100%; opacity: 1; }
      45% { opacity: 0; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes sample-vuln-flash {
      0%, 40% { background: transparent; color: inherit; box-shadow: none; }
      45%, 85% { background: rgba(239, 68, 68, 0.15); color: var(--color-critical); box-shadow: inset 2px 0 0 var(--color-critical); }
      90%, 100% { background: transparent; color: inherit; box-shadow: none; }
    }
    .btn-sample-action {
      width: 100%;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: var(--space-1);
    }
    .sample-card:hover .btn-sample-action {
      background: var(--gradient-primary);
      border-color: transparent;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    @media (max-width: 1024px) {
      .samples-track { grid-template-columns: 1fr; }
    }

    /* === Stats Section === */
    .stats-section {
      display: flex;
      justify-content: center;
      gap: var(--space-16);
      padding: var(--space-12) 0;
      border-top: 1px solid var(--color-border-subtle);
    }

    .stat-item { text-align: center; }
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
        min-height: 60vh;
        padding: var(--space-6) 0;
      }
      .hero-actions { justify-content: center; }
      .hero-visual { display: none; }
      .hero-subtitle { margin-left: auto; margin-right: auto; }
      .features-track { grid-template-columns: 1fr; }
      .stats-section {
        flex-direction: column;
        gap: var(--space-6);
      }
    }

    @media (max-width: 768px) {
      .dashboard { padding: 0 var(--space-4); }
      .hero { min-height: auto; padding: var(--space-4) 0; gap: var(--space-6); }
      .hero-title { font-size: clamp(1.8rem, 6vw, 2.5rem); }
      .hero-badge { font-size: 0.7rem; padding: var(--space-1) var(--space-3); }
      .hero-subtitle { font-size: 0.9rem; }
      .hero-actions { flex-direction: column; align-items: stretch; }
      .hero-actions .btn { justify-content: center; }
      .features-scroll-wrapper { padding: var(--space-8) 0; }
      .features-title { font-size: clamp(1.5rem, 5vw, 2rem); }
      .feature-card { padding: var(--space-4); }
      .feature-number { font-size: 2rem; }
      .samples { padding: var(--space-8) 0; }
      .section-header h2 { font-size: 1.5rem; }
      .samples-grid { grid-template-columns: 1fr; }
      .stats-section { gap: var(--space-4); padding: var(--space-8) 0; }
      .stat-value { font-size: 2rem; }
    }

    @media (max-width: 480px) {
      .dashboard { padding: 0 var(--space-3); }
      .hero-title { font-size: 1.6rem; line-height: 1.15; }
      .hero-badge { font-size: 0.65rem; }
      .hero-subtitle { font-size: 0.85rem; }
      .feature-card { padding: var(--space-3); }
      .section-header h2 { font-size: 1.25rem; }
      .sample-card { padding: var(--space-3); }
      .stat-value { font-size: 1.75rem; }
      .stat-label { font-size: 0.75rem; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('networkCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroBadge') heroBadge!: ElementRef;
  @ViewChild('heroTitle') heroTitle!: ElementRef;
  @ViewChild('heroSub') heroSub!: ElementRef;
  @ViewChild('heroActions') heroActions!: ElementRef;
  @ViewChild('heroVisual') heroVisual!: ElementRef;
  @ViewChild('featuresSection') featuresSection!: ElementRef;
  @ViewChild('featuresTrack') featuresTrack!: ElementRef;
  @ViewChild('featuresTitle') featuresTitle!: ElementRef;
  @ViewChild('samplesSection') samplesSection!: ElementRef;
  @ViewChild('statsSection') statsSection!: ElementRef;

  samples = signal<SampleContract[]>([]);

  processSteps = [
    { num: '01', title: 'Connect & Upload', desc: 'Drag and drop Solidity files or paste a verified contract address.' },
    { num: '02', title: 'Deep Analysis', desc: 'Our dual-engine scans for 100+ vulnerability patterns and logic errors.' },
    { num: '03', title: 'Detailed Report', desc: 'Receive a comprehensive audit with severity scoring and fix suggestions.' }
  ];

  capabilities = [
    { icon: 'code', title: 'AST Parsing', desc: 'Deep syntax tree analysis for hidden logic errors.' },
    { icon: 'shield', title: 'Reentrancy Guard', desc: 'Advanced detection of state changes after external calls.' },
    { icon: 'cpu', title: 'Gas Profiler', desc: 'Bytecode-level optimization suggestions.' },
    { icon: 'lock', title: 'Access Control', desc: 'Verification of owner/admin role implementation.' },
    { icon: 'zap', title: 'Slither Integration', desc: 'Powered by industry-standard static analysis tools.' },
    { icon: 'layers', title: 'Upgrade Safety', desc: 'Proxy storage layout compatibility checks.' }
  ];

  // Simulation State
  simulationState = signal<'typing' | 'scanning' | 'analyzing' | 'complete' | 'transition'>('typing');
  score = signal(0);

  private scenarios: SimulationScenario[] = [
    {
      id: 'reentrancy',
      filename: 'ReentrancyVault.sol',
      code: `contract Vault {
    mapping(address => uint) balances;

    function withdraw(uint amount) external {
        require(balances[msg.sender] >= amount);
        
        // @audit: Interaction before update
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);

        balances[msg.sender] -= amount;
    }
}`,
      vulns: [{ line: 6, type: 'critical', message: 'Reentrancy Detected' }],
      score: 45
    },
    {
      id: 'access',
      filename: 'AdminPanel.sol',
      code: `contract AdminPanel {
    address public owner;

    function setOwner(address newOwner) public {
        // @audit: Missing access control
        owner = newOwner;
    }

    function emergencyStop() external {
        // @audit: Anyone can call this
        selfdestruct(payable(owner));
    }
}`,
      vulns: [
        { line: 4, type: 'critical', message: 'Missing Access Control' },
        { line: 9, type: 'high', message: 'Unprotected Selfdestruct' }
      ],
      score: 20
    },
    {
      id: 'gas',
      filename: 'TokenDistributor.sol',
      code: `contract Distributor {
    address[] public recipients;

    function distribute() external {
        // @audit: Unbounded loop
        for(uint i = 0; i < recipients.length; i++) {
             // @audit: High gas cost per iteration
             TransferHelper.safeTransfer(token, recipients[i], 100);
        }
    }
}`,
      vulns: [{ line: 5, type: 'info', message: 'Gas: Cache Array Length' }],
      score: 82
    }
  ];

  currentScenarioIndex = signal(0);
  currentScenario = computed(() => this.scenarios[this.currentScenarioIndex()]);

  codeLines = computed(() => this.currentScenario().code.split('\n'));

  private codeIndex = signal(0);
  animatedCode = computed(() => this.currentScenario().code.substring(0, this.codeIndex()));

  private animFrameId = 0;
  private particles: Particle[] = [];
  private ctx!: CanvasRenderingContext2D;
  private mouseX = 0;
  private mouseY = 0;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;

  constructor(
    private analysisService: AnalysisService,
    public themeService: ThemeService,
    private ngZone: NgZone,
  ) { }

  toggleTheme() {
    const effective = this.themeService.currentTheme();
    this.themeService.setTheme(effective === 'dark' ? 'light' : 'dark');
  }

  ngOnInit() {
    this.loadSamples();
    this.runSimulation();
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.initGsapAnimations();
    this.initMouseLight();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
    ScrollTrigger.getAll().forEach(t => t.kill());
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
  }

  // ── Particle Network Canvas ──
  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas(canvas);
    window.addEventListener('resize', () => this.resizeCanvas(canvas));

    // spawn particles
    const count = Math.min(100, Math.floor(window.innerWidth / 15)); // Higher density
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
      });
    }

    this.ngZone.runOutsideAngular(() => this.drawLoop());
  }

  private resizeCanvas(c: HTMLCanvasElement) {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  }

  private drawLoop() {
    const { ctx, particles } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = this.themeService.currentTheme() === 'dark';
    const nodeColor = isDark ? 'rgba(99,102,241,0.6)' : 'rgba(109,40,217,0.4)';
    const lineColor = isDark ? 'rgba(99,102,241,' : 'rgba(109,40,217,';

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
    });

    // draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const alpha = (1 - dist / 150) * 0.35;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = lineColor + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.drawLoop());
  }

  // ── GSAP Animations ──
  private initGsapAnimations() {
    // ─── Hero entrance with word-by-word reveal ───
    const heroTl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1 } });

    // Badge entrance
    heroTl.to(this.heroBadge.nativeElement, { opacity: 1, y: 0, duration: 0.6 });

    // Word-by-word reveal on hero title (GSAP signature effect)
    const heroWords = this.heroTitle.nativeElement.querySelectorAll('.word');
    heroTl.to(heroWords, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.08,
      ease: 'back.out(1.2)',
    }, '-=0.3');

    // Subtitle and actions follow
    heroTl
      .to(this.heroSub.nativeElement, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to(this.heroActions.nativeElement, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to(this.heroVisual.nativeElement, { opacity: 1, x: 0, duration: 1.2 }, '-=0.8');

    // ─── Features Section: word reveal on heading ───
    const featuresTitleWords = this.featuresTitle.nativeElement.querySelectorAll('.word');
    gsap.from(featuresTitleWords, {
      scale: 0,
      rotation: -180,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: this.featuresTitle.nativeElement,
        start: 'top 85%',
      }
    });

    // ─── Feature Cards: stagger slide-in from right ───
    const cards = this.featuresSection.nativeElement.querySelectorAll('.process-card');
    gsap.from(cards, {
      x: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: this.featuresSection.nativeElement,
        start: 'top 75%',
      }
    });

    // ─── Sample section — header slide in with parallax ───
    gsap.from(this.samplesSection.nativeElement.querySelector('.section-header'), {
      opacity: 0,
      y: 60,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: this.samplesSection.nativeElement,
        start: 'top 85%',
      }
    });

    // Sample cards horizontal stagger entrance
    const sampleCards = this.samplesSection.nativeElement.querySelectorAll('.sample-card');
    if (sampleCards.length > 0) {
      gsap.from(sampleCards, {
        opacity: 0,
        x: 100, // Slide in from right
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: this.samplesSection.nativeElement,
          start: 'top 75%',
        }
      });
    }

    // ─── Capabilities Section: Staggered entrance ───
    const capCards = document.querySelectorAll('.cap-card');
    if (capCards.length > 0) {
      gsap.from(capCards, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.capabilities-section',
          start: 'top 80%',
        }
      });
    }

    // ─── Stats — staggered direction entrance ───
    const statItems = this.statsSection.nativeElement.querySelectorAll('.stat-item');
    statItems.forEach((item: Element, i: number) => {
      const direction = i % 2 === 0 ? -40 : 40;
      gsap.from(item, {
        opacity: 0,
        x: direction,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: this.statsSection.nativeElement,
          start: 'top 90%',
        }
      });
    });

    // ─── Magnetic Buttons ───
    const magneticBtns = document.querySelectorAll('.btn-magnetic');
    magneticBtns.forEach((btn) => {
      const el = btn as HTMLElement;
      el.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { duration: 0.3, x: x * 0.3, y: y * 0.3, ease: 'power2.out' });
        // Move "inner" text more for parallax
        // assuming inner children exist
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { duration: 0.8, x: 0, y: 0, ease: 'elastic.out(1, 0.3)' });
      });
    });
  }

  // ── Mouse Follow Light ──
  private initMouseLight() {
    this.boundMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.mouse-light');
      cards.forEach((card) => {
        const el = card as HTMLElement;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    };
    document.addEventListener('mousemove', this.boundMouseMove);
  }

  // ── Data Loading ──
  private loadSamples() {
    this.analysisService.getSampleContracts().subscribe({
      next: (s) => {
        // Enforce mock data for visual consistency if backend doesn't provide it
        // Slice to 4 elements for a clean 2x2 grid
        const enhancedSamples = s.slice(0, 4).map((sample, index) => ({
          ...sample,
          id: sample['id'] || `sample-${index}`,
          difficulty: (sample['difficulty'] || (index % 3 === 0 ? 'Easy' : index % 3 === 1 ? 'Hard' : 'Medium')) as 'Easy' | 'Medium' | 'Hard'
        }));
        this.samples.set(enhancedSamples);
      },
      error: () => {
        // Fallback Mock Data if API fails - limited to 4 for the 2x2 grid layout
        this.samples.set([
          { id: '1', name: 'ReentrancyVulnerable.sol', filename: 'Reentrancy.sol', content: '...', description: 'Classic reentrancy attack vector', difficulty: 'Easy' },
          { id: '2', name: 'MissingAccessControl.sol', filename: 'AccessControl.sol', content: '...', description: 'Missing ownership validation', difficulty: 'Hard' },
          { id: '3', name: 'UnoptimizedContract.sol', filename: 'GasGuzzler.sol', content: '...', description: 'Inefficient storage patterns', difficulty: 'Medium' },
          { id: '4', name: 'WellWrittenContract.sol', filename: 'Secure.sol', content: '...', description: 'Clean proxy storage layout', difficulty: 'Easy' }
        ]);
      }
    });
  }

  // ── Audit Simulation ──
  // ── Audit Simulation ──
  runSimulation() {
    this.startScenario();
  }

  private startScenario() {
    this.codeIndex.set(0);
    this.simulationState.set('typing');
    this.score.set(0);

    const scenario = this.currentScenario();
    const typeSpeed = 20; // ms

    const typeChar = () => {
      if (this.simulationState() !== 'typing') return;

      if (this.codeIndex() < scenario.code.length) {
        this.codeIndex.update(i => i + 1);
        setTimeout(typeChar, Math.random() * 15 + 10);
      } else {
        // Typing done, start scanning
        this.simulationState.set('scanning');
        setTimeout(() => this.analyzeScenario(), 1500);
      }
    };

    setTimeout(typeChar, 500);
  }

  private analyzeScenario() {
    this.simulationState.set('analyzing');
    // Simulate showing results after analysis
    setTimeout(() => {
      this.simulationState.set('complete');
      this.animateScore(this.currentScenario().score);

      // Schedule next scenario
      setTimeout(() => this.transitionToNextScenario(), 4000);
    }, 1500);
  }

  private transitionToNextScenario() {
    this.simulationState.set('transition');
    setTimeout(() => {
      const nextIndex = (this.currentScenarioIndex() + 1) % this.scenarios.length;
      this.currentScenarioIndex.set(nextIndex);
      this.startScenario(); // Loop
    }, 800); // Wait for fade out
  }

  private animateScore(target: number) {
    let current = 0;
    const interval = setInterval(() => {
      if (current >= target) {
        clearInterval(interval);
        this.score.set(target);
      } else {
        current += 1;
        this.score.set(current);
      }
    }, 15);
  }

  selectSample(sample: SampleContract) {
    sessionStorage.setItem('selectedSample', JSON.stringify(sample));
    window.location.href = '/analyze';
  }
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
}

interface SimulationScenario {
  id: string;
  filename: string;
  code: string;
  vulns: { line: number, type: 'critical' | 'high' | 'medium' | 'info', message: string }[];
  score: number;
}
