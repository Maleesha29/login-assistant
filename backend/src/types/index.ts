export interface AccountRecord {
  company: string;
  game: string;
  url: string;
  username: string;
  password?: string;
  rowNumber?: number;
  sheetSource?: string;
}

export interface SheetCompanyData {
  companyName: string;
  games: Map<string, AccountRecord>;
}

export interface SheetSummary {
  name: string;
  idOrUrl?: string;
  totalCompanies: number;
  totalAccounts: number;
}

export interface SheetIndex {
  companies: Map<string, SheetCompanyData>;
  allAccounts: AccountRecord[];
  lastUpdated: Date;
  isMockData: boolean;
  spreadsheetTitle?: string;
  sheets?: SheetSummary[];
}

export interface SearchSuggestion {
  company: string;
  game: string;
  url: string;
  username: string;
  label: string;
  score: number;
  sheetSource?: string;
}

export interface AccountPreviewResponse {
  company: string;
  game: string;
  url: string;
  username: string;
  hasPassword: boolean;
  password?: string;
  sheetSource?: string;
  fallbacks?: Array<{ game: string; url: string }>;
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

export interface SiteStepAction {
  action: 'fill' | 'click' | 'wait' | 'waitForSelector' | 'pressKey';
  selector?: string;
  valueType?: 'username' | 'password' | 'custom';
  customValue?: string;
  timeoutMs?: number;
  description?: string;
  optional?: boolean;
}

export interface SiteLoginConfig {
  companyOrDomain: string;
  description?: string;
  usernameSelector?: string | string[];
  passwordSelector?: string | string[];
  loginSelector?: string | string[];
  waitAfterLogin?: number;
  isMultiStep?: boolean;
  customSteps?: SiteStepAction[];
  beforeLogin?: (page: any, account: AccountRecord) => Promise<void>;
  afterLogin?: (page: any, account: AccountRecord) => Promise<void>;
}
