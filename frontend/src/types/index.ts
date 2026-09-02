export interface SearchSuggestion {
  company: string;
  game: string;
  url: string;
  username: string;
  label: string;
  score: number;
}

export interface AccountPreview {
  company: string;
  game: string;
  url: string;
  username: string;
  hasPassword: boolean;
  password?: string;
}

export type AutomationStep =
  | 'INIT'
  | 'FINDING_COMPANY'
  | 'FINDING_GAME'
  | 'ACCOUNT_FOUND'
  | 'LAUNCHING_BROWSER'
  | 'OPENING_WEBSITE'
  | 'ENTERING_USERNAME'
  | 'ENTERING_PASSWORD'
  | 'SUBMITTING_LOGIN'
  | 'LOGIN_COMPLETED'
  | 'ERROR';

export interface AutomationProgressEvent {
  step: AutomationStep;
  message: string;
  progressPercent: number;
  timestamp: string;
  details?: Record<string, any>;
  error?: string;
}

export interface BackendStats {
  initialized: boolean;
  totalCompanies: number;
  totalAccounts: number;
  lastUpdated: string | null;
  isMockData: boolean;
  spreadsheetTitle: string;
  configured: boolean;
}

export interface SavedItem {
  id: string;
  company: string;
  game: string;
  timestamp: number;
}
