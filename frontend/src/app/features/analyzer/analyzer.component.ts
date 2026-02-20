import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalysisService, SampleContract } from '../../core/services/analysis.service';
import { ThemeService } from '../../core/services/theme.service';
import gsap from 'gsap';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="analyzer">
      <div class="analyzer-header" #analyzerHeader>
        <div class="header-content">
          <h1>Contract <span class="gradient-text-animated">Analyzer</span></h1>
          <p>Upload, paste, or fetch your Solidity contracts for comprehensive analysis</p>
        </div>
        <div class="header-actions">
          <button class="theme-toggle btn btn-ghost" (click)="toggleTheme()" [title]="'Current theme: ' + themeService.preference()">
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
          <button class="btn btn-primary btn-liquid glow" (click)="analyze()" [disabled]="isAnalyzing() || !code()">
            @if (isAnalyzing()) {
              <div class="btn-spinner"></div>
              Analyzing...
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
              </svg>
              Analyze Contract
            }
          </button>
        </div>
      </div>

      <div class="analyzer-options glass-premium" #optionsBar>
        <div class="option-group">
          <label class="option">
            <input type="checkbox" [(ngModel)]="options.securityAudit">
            <span class="checkbox"></span>
            <span class="option-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Security Audit
            </span>
          </label>
          <label class="option">
            <input type="checkbox" [(ngModel)]="options.gasOptimization">
            <span class="checkbox"></span>
            <span class="option-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Gas Optimization
            </span>
          </label>
          <label class="option">
            <input type="checkbox" [(ngModel)]="options.aiReview">
            <span class="checkbox"></span>
            <span class="option-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
              </svg>
              AI Review
            </span>
          </label>
        </div>
        <div class="option-info">
          <span class="compiler-info">Solidity ^0.8.20</span>
        </div>
      </div>

      <!-- Source Tabs -->
      <div class="source-tabs" #sourceTabs>
        <button class="source-tab" [class.active]="activeTab() === 'upload'" (click)="setActiveTab('upload')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Upload
        </button>
        <button class="source-tab" [class.active]="activeTab() === 'liveUrl'" (click)="setActiveTab('liveUrl')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          Live URL
        </button>
        <button class="source-tab" [class.active]="activeTab() === 'github'" (click)="setActiveTab('github')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
          </svg>
          GitHub
        </button>
      </div>

      <!-- Upload Tab Content -->
      @if (activeTab() === 'upload') {
        <div class="tab-content fade-in">
          <div class="upload-area" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)" [class.drag-over]="isDragOver()">
            <label class="upload-zone glass-premium glow-border" for="fileInput">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <p class="upload-title">Drop your .sol file here or click to browse</p>
              <p class="upload-hint">Supports single .sol files</p>
              <input id="fileInput" type="file" accept=".sol" (change)="onFileUpload($event)" hidden>
            </label>
          </div>
        </div>
      }

      <!-- Live URL Tab Content -->
      @if (activeTab() === 'liveUrl') {
        <div class="tab-content fade-in">
          <div class="fetch-area glass-premium">
            <div class="fetch-header">
              <h3>Block Explorer URL</h3>
              <p class="text-secondary">Enter a block explorer URL to audit a deployed smart contract</p>
            </div>
            <div class="fetch-input-group">
              <input
                type="text"
                class="fetch-input"
                [(ngModel)]="explorerUrl"
                placeholder="eg. https://etherscan.io/address/0x..."
                (keydown.enter)="fetchFromExplorer()"
              >
              <button class="btn btn-primary fetch-btn" (click)="fetchFromExplorer()" [disabled]="isFetching()">
                @if (isFetching()) {
                  <div class="btn-spinner"></div>
                  Fetching...
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  Fetch Source
                }
              </button>
            </div>
            <div class="supported-networks">
              <span class="networks-label">Supported:</span>
              <span class="network-tag">Etherscan</span>
              <span class="network-tag">Sepolia</span>
              <span class="network-tag">ArbiScan</span>
              <span class="network-tag">BSCScan</span>
              <span class="network-tag">PolygonScan</span>
              <span class="network-tag">BaseScan</span>
              <span class="network-tag">SnowTrace</span>
              <span class="network-tag">ScrollScan</span>
              <span class="network-tag">zkSync</span>
              <span class="network-tag">BlastScan</span>
              <span class="network-tag">MoonScan</span>
            </div>
          </div>
        </div>
      }

      <!-- GitHub Tab Content -->
      @if (activeTab() === 'github') {
        <div class="tab-content fade-in">
          <div class="fetch-area glass-premium">
            <div class="fetch-header">
              <h3>GitHub Repository</h3>
              <p class="text-secondary">Enter a GitHub URL to fetch Solidity files from a public repository</p>
            </div>
            <div class="fetch-input-group">
              <input
                type="text"
                class="fetch-input"
                [(ngModel)]="githubUrl"
                placeholder="eg. https://github.com/user/repo/blob/main/contracts/Token.sol"
                (keydown.enter)="fetchFromGithub()"
              >
              <button class="btn btn-primary fetch-btn" (click)="fetchFromGithub()" [disabled]="isFetching()">
                @if (isFetching()) {
                  <div class="btn-spinner"></div>
                  Fetching...
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Fetch Source
                }
              </button>
            </div>
            <div class="github-hints">
              <span class="hint-label">Supports:</span>
              <span class="hint-item">Single .sol file URLs</span>
              <span class="hint-sep">·</span>
              <span class="hint-item">Directory URLs (fetches all .sol files)</span>
              <span class="hint-sep">·</span>
              <span class="hint-item">Public repos only</span>
            </div>
          </div>
        </div>
      }

      <!-- Fetched Contract Info -->
      @if (fetchedMetadata()) {
        <div class="fetched-info glass slide-up">
          <div class="fetched-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            Source fetched successfully
          </div>
          <div class="fetched-details">
            @if (fetchedMetadata()?.contractName) {
              <span class="detail-item"><strong>Contract:</strong> {{ fetchedMetadata()?.contractName }}</span>
            }
            @if (fetchedMetadata()?.network) {
              <span class="detail-item"><strong>Network:</strong> {{ fetchedMetadata()?.network }}</span>
            }
            @if (fetchedMetadata()?.compilerVersion) {
              <span class="detail-item"><strong>Compiler:</strong> {{ fetchedMetadata()?.compilerVersion }}</span>
            }
          </div>
        </div>
      }

      <!-- Code Editor (shared across all tabs) -->
      <div class="editor-container">
        <div class="editor-wrapper glass-premium glow-border" #editorWrapper>
          <div class="editor-header">
            <div class="editor-tabs">
              <button class="tab active">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                </svg>
                {{ displayFilename() }}
              </button>
              @if (fetchedContracts().length > 1) {
                <span class="file-count">+{{ fetchedContracts().length - 1 }} more files</span>
              }
            </div>
            <div class="editor-actions">
              <span class="line-count">{{ lineCount() }} lines</span>
            </div>
          </div>
          <div class="editor-body">
            <div class="line-numbers">
              @for (line of lineNumbers(); track $index) {
                <span>{{ line }}</span>
              }
            </div>
            <textarea 
              #editorTextarea
              class="code-editor"
              [(ngModel)]="codeValue"
              (ngModelChange)="onCodeChange($event)"
              placeholder="// Paste your Solidity code here...

pragma solidity ^0.8.20;

contract MyContract {
    // Your code
}"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        @if (error()) {
          <div class="error-banner slide-up">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <span>{{ error() }}</span>
            <button class="dismiss-btn" (click)="error.set('')">×</button>
          </div>
        }
      </div>

      <!-- Loading Overlay -->
      @if (isAnalyzing()) {
        <div class="loading-overlay">
          <!-- Matrix Rain Background -->
          <div class="matrix-rain">
            @for (col of matrixCols; track $index) {
              <div class="matrix-col" [style.left.%]="col.left" [style.animation-duration]="col.speed + 's'" [style.animation-delay]="col.delay + 's'">
                @for (char of col.chars; track $index) {
                  <span>{{ char }}</span>
                }
              </div>
            }
          </div>
          <div class="loading-content glass-premium glow-border">
            <div class="magic-loader">
              <div class="loader-ring"></div>
              <div class="loader-ring"></div>
              <div class="loader-ring"></div>
              <svg class="loader-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 class="gradient-text-animated">Analyzing Contract</h3>
            <p class="loading-status">{{ loadingStatus() }}</p>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress()"></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .analyzer {
      max-width: 1200px;
      margin: 0 auto;
    }

    .analyzer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
    }

    .header-content h1 {
      margin-bottom: var(--space-2);
    }

    .header-content p {
      color: var(--color-text-secondary);
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Options */
    .analyzer-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-5);
    }

    .option-group {
      display: flex;
      gap: var(--space-6);
    }

    .option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
    }

    .option input { display: none; }

    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s var(--ease-out-expo);
    }

    .option input:checked + .checkbox {
      background: var(--gradient-primary);
      border-color: var(--color-accent-primary);
    }

    .option input:checked + .checkbox::after {
      content: '✓';
      color: white;
      font-size: 12px;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .option:hover .option-label {
      color: var(--color-text-primary);
    }

    .compiler-info {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      background: var(--color-bg-tertiary);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
    }

    /* Source Tabs */
    .source-tabs {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
      background: var(--color-bg-secondary);
      padding: var(--space-1);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-subtle);
    }

    .source-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.4s var(--ease-out-expo);
    }

    .source-tab:hover {
      color: var(--color-text-primary);
      background: var(--color-fill-subtle);
      transform: translateY(-1px);
    }

    .source-tab.active {
      background: var(--gradient-primary);
      color: white;
      box-shadow: var(--shadow-glow);
      transform: scale(1.02);
    }

    /* Tab Content */
    .tab-content {
      margin-bottom: var(--space-5);
    }

    /* Upload Area */
    .upload-area {
      position: relative;
    }

    .upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-10);
      border-radius: var(--radius-lg);
      border: 2px dashed rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s var(--ease-out-expo);
      text-align: center;
    }

    .upload-zone:hover {
      border-color: var(--color-accent-primary);
      background: rgba(99, 102, 241, 0.05);
    }

    .upload-zone svg {
      color: var(--color-text-muted);
    }

    .upload-zone:hover svg {
      color: var(--color-accent-primary);
    }

    .drag-over .upload-zone {
      border-color: var(--color-accent-primary);
      background: rgba(99, 102, 241, 0.1);
      transform: scale(1.01);
    }

    .upload-title {
      font-size: 1rem;
      color: var(--color-text-secondary);
    }

    .upload-hint {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    /* Fetch Area (Live URL & GitHub) */
    .fetch-area {
      padding: var(--space-8);
      border-radius: var(--radius-lg);
    }

    .fetch-header {
      margin-bottom: var(--space-5);
    }

    .fetch-header h3 {
      margin-bottom: var(--space-1);
      font-size: 1.25rem;
    }

    .fetch-input-group {
      display: flex;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .fetch-input {
      flex: 1;
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-tertiary);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-family: var(--font-mono);
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .fetch-input:focus {
      border-color: var(--color-accent-primary);
    }

    .fetch-input::placeholder {
      color: var(--color-text-muted);
    }

    .fetch-btn {
      white-space: nowrap;
      min-width: 140px;
    }

    /* Supported Networks */
    .supported-networks {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }

    .networks-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-right: var(--space-1);
    }

    .network-tag {
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      background: var(--color-bg-tertiary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border-subtle);
    }

    /* GitHub Hints */
    .github-hints {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .hint-label {
      margin-right: var(--space-1);
    }

    .hint-item {
      color: var(--color-text-secondary);
    }

    .hint-sep {
      color: var(--color-text-muted);
    }

    /* Fetched Info */
    .fetched-info {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-5);
      border: 1px solid rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.05);
    }

    .fetched-badge {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-neon-green);
      font-weight: 500;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .fetched-details {
      display: flex;
      gap: var(--space-4);
      flex-wrap: wrap;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .detail-item strong {
      color: var(--color-text-primary);
    }

    /* File count badge */
    .file-count {
      font-size: 0.75rem;
      color: var(--color-accent-primary);
      background: rgba(99, 102, 241, 0.1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      margin-left: var(--space-2);
    }

    /* Editor */
    .editor-wrapper {
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) var(--space-4);
      background: var(--editor-header-bg);
      border-bottom: 1px solid var(--editor-border);
    }

    .editor-tabs {
      display: flex;
      align-items: center;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-bg-tertiary);
      border: none;
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
      font-size: 0.8rem;
      font-family: var(--font-mono);
      cursor: default;
    }

    .line-count {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .editor-body {
      display: flex;
      min-height: 500px;
      max-height: 600px;
    }

    .line-numbers {
      padding: var(--space-4) var(--space-3);
      background: var(--editor-line-bg);
      color: var(--color-text-muted);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.6;
      text-align: right;
      user-select: none;
      display: flex;
      flex-direction: column;
      min-width: 50px;
    }

    .code-editor {
      flex: 1;
      padding: var(--space-4);
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      line-height: 1.6;
      resize: none;
      outline: none;
      overflow: auto;
    }

    .code-editor::placeholder {
      color: var(--color-text-muted);
    }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      margin-top: var(--space-4);
      color: var(--color-critical);
    }

    .dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.7;
    }

    .dismiss-btn:hover { opacity: 1; }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 15, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      animation: fadeIn 0.3s var(--ease-out-expo);
      overflow: hidden;
    }

    /* Matrix Rain */
    .matrix-rain {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .matrix-col {
      position: absolute;
      top: -100%;
      display: flex;
      flex-direction: column;
      font-family: var(--font-mono);
      font-size: 14px;
      color: rgba(34, 211, 238, 0.25);
      animation: matrix-fall linear infinite;
      line-height: 1.4;
    }
    .matrix-col span:first-child {
      color: rgba(99, 102, 241, 0.6);
      text-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
    }
    @keyframes matrix-fall {
      0% { transform: translateY(0); }
      100% { transform: translateY(250%); }
    }

    .loading-content {
      padding: var(--space-10);
      border-radius: var(--radius-xl);
      text-align: center;
      max-width: 400px;
      z-index: 1;
    }

    .magic-loader {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto var(--space-6);
    }

    .loader-ring {
      position: absolute;
      inset: 0;
      border: 2px solid transparent;
      border-radius: 50%;
    }

    .loader-ring:nth-child(1) {
      border-top-color: var(--color-accent-primary);
      animation: spin 1.5s linear infinite;
    }

    .loader-ring:nth-child(2) {
      inset: 10px;
      border-right-color: var(--color-accent-secondary);
      animation: spin 2s linear infinite reverse;
    }

    .loader-ring:nth-child(3) {
      inset: 20px;
      border-bottom-color: var(--color-neon-cyan);
      animation: spin 2.5s linear infinite;
    }

    .loader-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--color-accent-primary);
      animation: pulse 2s var(--ease-in-out-expo) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    }

    .loading-content h3 {
      margin-bottom: var(--space-2);
    }

    .loading-status {
      color: var(--color-text-secondary);
      margin-bottom: var(--space-4);
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .progress-bar {
      height: 4px;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--gradient-neon);
      background-size: 200% 100%;
      border-radius: var(--radius-full);
      transition: width 0.5s var(--ease-out-expo);
      animation: gradient-flow 2s linear infinite;
    }

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
      .analyzer { padding: 0 var(--space-4); }
      .analyzer-header {
        flex-direction: column;
        gap: var(--space-4);
        align-items: stretch;
      }
      .header-actions {
        justify-content: flex-start;
      }
      .analyzer-options {
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-3);
        align-items: flex-start;
      }
      .option-group {
        flex-wrap: wrap;
        gap: var(--space-3);
      }
      .source-tab {
        padding: var(--space-2) var(--space-3);
        font-size: 0.8rem;
      }
      .upload-zone { padding: var(--space-6); }
      .fetch-area { padding: var(--space-5); }
      .fetch-input-group {
        flex-direction: column;
      }
      .editor-wrapper { min-height: 350px; }
      .line-numbers { min-width: 36px; padding: var(--space-3) var(--space-2); }
      .editor-textarea {
        padding: var(--space-3);
        font-size: 0.75rem;
      }
      .editor-header { padding: var(--space-2) var(--space-3); }
    }

    @media (max-width: 480px) {
      .analyzer { padding: 0 var(--space-3); }
      .header-content h1 { font-size: 1.5rem; }
      .header-content p { font-size: 0.85rem; }
      .source-tab { font-size: 0; gap: 0; padding: var(--space-2); }
      .source-tab svg { font-size: initial; }
      .upload-zone { padding: var(--space-4); }
      .upload-title { font-size: 0.9rem; }
      .editor-wrapper { min-height: 280px; }
      .fetch-area { padding: var(--space-3); }
      .fetch-header h3 { font-size: 1rem; }
    }
  `]
})
export class AnalyzerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('analyzerHeader') analyzerHeader!: ElementRef;
  @ViewChild('optionsBar') optionsBar!: ElementRef;
  @ViewChild('sourceTabs') sourceTabs!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;

  codeValue = '';
  code = signal('');
  filename = signal('contract.sol');
  error = signal('');
  isAnalyzing = signal(false);
  isFetching = signal(false);
  isDragOver = signal(false);
  loadingStatus = signal('Compiling contract...');
  progress = signal(0);

  activeTab = signal<'upload' | 'liveUrl' | 'github'>('upload');
  explorerUrl = '';
  githubUrl = '';
  fetchedMetadata = signal<any>(null);
  fetchedContracts = signal<any[]>([]);

  options = {
    securityAudit: true,
    gasOptimization: true,
    aiReview: true
  };

  // Matrix rain columns for loading overlay
  matrixCols = Array.from({ length: 20 }, () => ({
    left: Math.random() * 100,
    speed: 4 + Math.random() * 6,
    delay: Math.random() * 3,
    chars: Array.from({ length: 15 }, () => {
      const chars = '0123456789abcdef{}();=><+-*/&|!^~';
      return chars[Math.floor(Math.random() * chars.length)];
    })
  }));

  lineCount = computed(() => {
    const lines = this.code().split('\n').length;
    return lines || 1;
  });

  lineNumbers = computed(() => {
    const count = this.lineCount();
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  displayFilename = computed(() => {
    const name = this.filename();
    const parts = name.split('/');
    return parts[parts.length - 1] || name;
  });

  constructor(
    private analysisService: AnalysisService,
    private router: Router,
    public themeService: ThemeService
  ) { }

  toggleTheme() {
    const effective = this.themeService.currentTheme();
    this.themeService.setTheme(effective === 'dark' ? 'light' : 'dark');
  }

  ngOnInit() {
    // Check for pre-selected sample (from landing page)
    const sampleStr = sessionStorage.getItem('selectedSample');
    if (sampleStr) {
      const sample = JSON.parse(sampleStr) as SampleContract;
      this.codeValue = sample.content;
      this.code.set(sample.content);
      this.filename.set(sample.filename);
      sessionStorage.removeItem('selectedSample');
    } else {
      // Check for last analyzed code (returning from results)
      const lastCode = this.analysisService.lastAnalyzedCode();
      if (lastCode && lastCode.length > 0) {
        const file = lastCode[0];
        this.codeValue = file.content;
        this.code.set(file.content);
        this.filename.set(file.filename);
      }
    }
  }

  ngAfterViewInit() {
    if (this.editorTextarea) {
      this.editorTextarea.nativeElement.addEventListener('scroll', (e) => {
        const lineNumbers = document.querySelector('.line-numbers') as HTMLElement;
        if (lineNumbers) {
          lineNumbers.scrollTop = (e.target as HTMLElement).scrollTop;
        }
      });
    }

    // GSAP entrance animations
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(this.analyzerHeader?.nativeElement, { opacity: 0, y: -20, duration: 0.6 })
      .from(this.optionsBar?.nativeElement, { opacity: 0, y: 15, duration: 0.5 }, '-=0.3')
      .from(this.sourceTabs?.nativeElement, { opacity: 0, y: 15, duration: 0.5 }, '-=0.3')
      .from(this.editorWrapper?.nativeElement, { opacity: 0, y: 25, duration: 0.7 }, '-=0.3');
  }

  ngOnDestroy() {
    gsap.killTweensOf('*');
  }

  setActiveTab(tab: 'upload' | 'liveUrl' | 'github') {
    this.activeTab.set(tab);
    this.error.set('');
  }

  onCodeChange(value: string) {
    this.code.set(value);
    this.error.set('');
  }

  onFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.filename.set(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.codeValue = content;
        this.code.set(content);
        this.fetchedMetadata.set(null);
      };
      reader.readAsText(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.sol')) {
      this.filename.set(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.codeValue = content;
        this.code.set(content);
        this.fetchedMetadata.set(null);
      };
      reader.readAsText(file);
    } else {
      this.error.set('Please drop a .sol file');
    }
  }

  async fetchFromExplorer() {
    if (!this.explorerUrl.trim()) {
      this.error.set('Please enter a block explorer URL or contract address');
      return;
    }

    this.isFetching.set(true);
    this.error.set('');
    this.fetchedMetadata.set(null);

    try {
      const result = await this.analysisService.fetchFromUrl(this.explorerUrl.trim()).toPromise();

      if ((result as any)?.error) {
        this.error.set((result as any).error);
        this.isFetching.set(false);
        return;
      }

      if (result?.contracts && result.contracts.length > 0) {
        // Use the first contract's content in editor
        const mainContract = result.contracts[result.contracts.length - 1]; // Last is usually the main contract
        this.codeValue = mainContract.content;
        this.code.set(mainContract.content);
        this.filename.set(result.metadata?.contractName ? result.metadata.contractName + '.sol' : mainContract.filename);
        this.fetchedContracts.set(result.contracts);
        this.fetchedMetadata.set(result.metadata || {});
      } else {
        this.error.set('No source code found. The contract may not be verified.');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch contract source code');
    }

    this.isFetching.set(false);
  }

  async fetchFromGithub() {
    if (!this.githubUrl.trim()) {
      this.error.set('Please enter a GitHub URL');
      return;
    }

    this.isFetching.set(true);
    this.error.set('');
    this.fetchedMetadata.set(null);

    try {
      const result = await this.analysisService.fetchFromGithub(this.githubUrl.trim()).toPromise();

      if ((result as any)?.error) {
        this.error.set((result as any).error);
        this.isFetching.set(false);
        return;
      }

      if (result?.contracts && result.contracts.length > 0) {
        const mainContract = result.contracts[0];
        this.codeValue = mainContract.content;
        this.code.set(mainContract.content);
        this.filename.set(mainContract.filename);
        this.fetchedContracts.set(result.contracts);
        this.fetchedMetadata.set({ contractName: mainContract.filename, network: 'GitHub' });
      } else {
        this.error.set('No Solidity files found at the specified URL');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch from GitHub');
    }

    this.isFetching.set(false);
  }

  async analyze() {
    if (!this.code()) {
      this.error.set('Please enter some Solidity code to analyze');
      return;
    }

    this.isAnalyzing.set(true);
    this.progress.set(0);

    // Build contracts array — include all fetched contracts if available
    const contracts = this.fetchedContracts().length > 0
      ? this.fetchedContracts()
      : [{ filename: this.filename(), content: this.code() }];

    const steps = [
      { status: 'Compiling contract...', progress: 20 },
      { status: 'Running security analysis...', progress: 45 },
      { status: 'Analyzing gas optimizations...', progress: 70 },
      { status: 'Generating AI review...', progress: 90 },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        this.loadingStatus.set(steps[stepIndex].status);
        this.progress.set(steps[stepIndex].progress);
        stepIndex++;
      }
    }, 800);

    try {
      const result = await this.analysisService.analyzeContract({
        contracts,
        options: {
          enableSecurityAudit: this.options.securityAudit,
          enableGasOptimization: this.options.gasOptimization,
          enableAiReview: this.options.aiReview
        }
      }).toPromise();

      clearInterval(progressInterval);
      this.progress.set(100);
      this.loadingStatus.set('Complete!');

      await new Promise(resolve => setTimeout(resolve, 500));
      this.router.navigate(['/results', result?.id]);

    } catch (err: any) {
      clearInterval(progressInterval);
      this.isAnalyzing.set(false);
      this.error.set(err.message || 'Analysis failed. Please check your code and try again.');
    }
  }
}
