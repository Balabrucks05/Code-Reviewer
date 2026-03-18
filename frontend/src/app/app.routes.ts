import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'analyzer',
    loadComponent: () =>
      import('./features/analyzer/analyzer.component').then(
        (m) => m.AnalyzerComponent
      ),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then(
        (m) => m.HistoryComponent
      ),
  },
  {
    path: 'results/:id',
    loadComponent: () =>
      import('./features/results/results.component').then(
        (m) => m.ResultsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
