import { AccountRecord, SheetIndex, SheetCompanyData } from '../types';

export function normalizeKey(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseSheetTabs(
  tabsData: Array<{ tabName: string; rows: any[][] }>,
  spreadsheetTitle: string = 'Google Sheet'
): SheetIndex {
  const companies = new Map<string, SheetCompanyData>();
  const allAccounts: AccountRecord[] = [];

  for (const { tabName, rows } of tabsData) {
    if (!tabName) continue;
    const cleanCompanyName = tabName.trim();
    if (!cleanCompanyName) continue;

    const normalizedCompany = normalizeKey(cleanCompanyName);
    let companyData = companies.get(normalizedCompany);
    if (!companyData) {
      companyData = {
        companyName: cleanCompanyName,
        games: new Map<string, AccountRecord>()
      };
      companies.set(normalizedCompany, companyData);
    }

    if (!rows || rows.length === 0) continue;

    const startIndex = (rows.length > 0 && isHeaderRow(rows[0])) ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawGame = row[0] ? String(row[0]).trim() : '';
      const rawUrl = row[1] ? String(row[1]).trim() : '';
      const rawUsername = row[2] ? String(row[2]).trim() : '';
      const rawPassword = row[3] ? String(row[3]).trim() : '';

      if (!rawGame && !rawUrl && !rawUsername) continue;
      if (!rawGame) continue;

      const normalizedGame = normalizeKey(rawGame);
      const record: AccountRecord = {
        company: cleanCompanyName,
        game: rawGame,
        url: formatUrl(rawUrl),
        username: rawUsername,
        password: rawPassword,
        rowNumber: i + 1
      };

      companyData.games.set(normalizedGame, record);
      allAccounts.push(record);
    }
  }

  return {
    companies,
    allAccounts,
    lastUpdated: new Date(),
    isMockData: false,
    spreadsheetTitle
  };
}

function isHeaderRow(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const first = String(row[0] || '').toLowerCase();
  const second = String(row[1] || '').toLowerCase();
  return (
    first.includes('game') ||
    first.includes('name') ||
    second.includes('url') ||
    second.includes('web') ||
    second.includes('link')
  );
}

function formatUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return 'https://' + trimmed;
}
