import { SearchSuggestion, AccountPreview, BackendStats, AutomationProgressEvent } from '../types';

const API_BASE = '/api';

export async function fetchStatus(): Promise<{ success: boolean; stats: BackendStats; browserOpen: boolean }> {
  const res = await fetch(API_BASE + '/status');
  if (!res.ok) throw new Error('Failed to fetch server status');
  return res.json();
}

export async function searchAccounts(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  const res = await fetch(API_BASE + '/search?q=' + encodeURIComponent(query.trim()));
  if (!res.ok) throw new Error('Failed to search accounts');
  const data = await res.json();
  return data.results || [];
}

export async function getAccountDetails(company: string, game: string): Promise<AccountPreview> {
  const res = await fetch(API_BASE + '/account?company=' + encodeURIComponent(company) + '&game=' + encodeURIComponent(game));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Account not found');
  }
  const data = await res.json();
  return data.account;
}

export async function refreshSheetData(sheetUrl?: string): Promise<{ success: boolean; message: string; stats: BackendStats }> {
  const res = await fetch(API_BASE + '/data/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrl })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to refresh Google Sheet data');
  }
  return res.json();
}

export async function fetchCompanies(): Promise<Array<{ name: string; gameCount: number }>> {
  const res = await fetch(API_BASE + '/companies');
  if (!res.ok) throw new Error('Failed to fetch companies');
  const data = await res.json();
  return data.companies || [];
}

export async function fetchGamesForCompany(company: string): Promise<AccountPreview[]> {
  const res = await fetch(API_BASE + '/companies/' + encodeURIComponent(company) + '/games');
  if (!res.ok) throw new Error('Failed to fetch games for company');
  const data = await res.json();
  return data.games || [];
}

export async function triggerLoginAutomation(
  company: string,
  game: string,
  onProgress: (event: AutomationProgressEvent) => void,
  options?: { keepBrowserOpen?: boolean; headless?: boolean }
): Promise<void> {
  const res = await fetch(API_BASE + '/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      company,
      game,
      keepBrowserOpen: options?.keepBrowserOpen ?? true,
      headless: options?.headless ?? false
    })
  });

  if (!res.ok) {
    throw new Error('Login request failed with status ' + res.status);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported by browser.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        try {
          const jsonStr = trimmed.substring(5).trim();
          if (jsonStr) {
            const event: AutomationProgressEvent = JSON.parse(jsonStr);
            onProgress(event);
          }
        } catch (e) {
          console.error('Error parsing SSE event payload:', e);
        }
      }
    }
  }
}
