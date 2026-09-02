import { AccountRecord, SheetIndex, SheetCompanyData } from '../types';

export function normalizeKey(text: string): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseSheetTabs(
  tabsData: Array<{ tabName: string; rows: any[][] }>,
  spreadsheetTitle: string = 'Google Sheet',
  sheetSource: string = 'Sheet 1'
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
        rowNumber: i + 1,
        sheetSource
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
    spreadsheetTitle,
    sheets: [
      {
        name: sheetSource,
        idOrUrl: spreadsheetTitle,
        totalCompanies: companies.size,
        totalAccounts: allAccounts.length
      }
    ]
  };
}

export function mergeSheetIndexes(indexes: SheetIndex[]): SheetIndex {
  const validIndexes = indexes.filter(Boolean);
  if (validIndexes.length === 0) {
    return {
      companies: new Map(),
      allAccounts: [],
      lastUpdated: new Date(),
      isMockData: false,
      spreadsheetTitle: 'No Sheets Configured',
      sheets: []
    };
  }

  if (validIndexes.length === 1) {
    return validIndexes[0];
  }

  const mergedCompanies = new Map<string, SheetCompanyData>();
  const mergedAccounts: AccountRecord[] = [];
  const sheetsSummary: Array<{ name: string; idOrUrl?: string; totalCompanies: number; totalAccounts: number }> = [];

  for (const idx of validIndexes) {
    if (idx.sheets && idx.sheets.length > 0) {
      sheetsSummary.push(...idx.sheets);
    } else {
      sheetsSummary.push({
        name: idx.spreadsheetTitle || 'Sheet',
        totalCompanies: idx.companies.size,
        totalAccounts: idx.allAccounts.length
      });
    }

    mergedAccounts.push(...idx.allAccounts);

    for (const [compNorm, compData] of idx.companies.entries()) {
      let existingComp = mergedCompanies.get(compNorm);
      if (!existingComp) {
        existingComp = {
          companyName: compData.companyName,
          games: new Map<string, AccountRecord>()
        };
        mergedCompanies.set(compNorm, existingComp);
      }

      for (const [gameNorm, record] of compData.games.entries()) {
        // If exact game exists in both sheets, preserve both by keying secondary if duplicate
        if (!existingComp.games.has(gameNorm)) {
          existingComp.games.set(gameNorm, record);
        } else {
          // Disambiguate duplicate game key
          const disambiguatedKey = `${gameNorm} (${record.sheetSource || 'Sheet'})`;
          existingComp.games.set(disambiguatedKey, record);
        }
      }
    }
  }

  const titles = sheetsSummary.map((s) => s.name).join(' & ');

  return {
    companies: mergedCompanies,
    allAccounts: mergedAccounts,
    lastUpdated: new Date(),
    isMockData: false,
    spreadsheetTitle: titles,
    sheets: sheetsSummary
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
