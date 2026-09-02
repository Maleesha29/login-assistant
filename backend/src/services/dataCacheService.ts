import { GoogleSheetsClient } from '../googleSheets/sheetsClient';
import { SheetIndex, AccountRecord, SearchSuggestion, AccountPreviewResponse } from '../types';
import { normalizeKey } from '../googleSheets/sheetParser';

export class DataCacheService {
  private sheetsClient: GoogleSheetsClient;
  private cache: SheetIndex | null = null;
  private isRefreshing: boolean = false;

  constructor() {
    this.sheetsClient = new GoogleSheetsClient();
  }

  public async init(): Promise<void> {
    await this.refresh();
  }

  public async refresh(sheetOverride?: string): Promise<SheetIndex> {
    if (this.isRefreshing && this.cache && !sheetOverride) {
      return this.cache;
    }

    this.isRefreshing = true;
    try {
      this.cache = await this.sheetsClient.fetchSpreadsheetData(sheetOverride);
      return this.cache;
    } catch (err: any) {
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  public getCache(): SheetIndex {
    if (!this.cache) {
      throw new Error('Data cache not yet initialized. Please wait or call refresh.');
    }
    return this.cache;
  }

  public getStats() {
    if (!this.cache) {
      return {
        initialized: false,
        totalCompanies: 0,
        totalAccounts: 0,
        lastUpdated: null,
        isMockData: false,
        spreadsheetTitle: 'Not configured',
        configured: this.sheetsClient.isConfigured()
      };
    }
    return {
      initialized: true,
      totalCompanies: this.cache.companies.size,
      totalAccounts: this.cache.allAccounts.length,
      lastUpdated: this.cache.lastUpdated,
      isMockData: this.cache.isMockData,
      spreadsheetTitle: this.cache.spreadsheetTitle,
      configured: this.sheetsClient.isConfigured()
    };
  }

  public search(rawQuery: string): SearchSuggestion[] {
    if (!this.cache) return [];
    const query = normalizeKey(rawQuery);
    if (!query) return [];

    const suggestions: SearchSuggestion[] = [];
    const tokens = query.split(' ').filter(Boolean);

    for (const [compNorm, companyData] of this.cache.companies.entries()) {
      for (const [gameNorm, record] of companyData.games.entries()) {
        const fullCombo = compNorm + ' ' + gameNorm;
        const companyName = record.company;
        const gameName = record.game;
        const label = companyName + ' - ' + gameName;

        let score = 0;

        if (fullCombo === query) {
          score = 100;
        } else if (fullCombo.startsWith(query)) {
          score = 80;
        } else if (compNorm === query) {
          score = 75;
        } else if (gameNorm === query) {
          score = 70;
        } else if (tokens.length > 1) {
          const allMatch = tokens.every(
            (token) => compNorm.includes(token) || gameNorm.includes(token)
          );
          if (allMatch) {
            if (compNorm.startsWith(tokens[0]) && gameNorm.startsWith(tokens[1])) {
              score = 65;
            } else {
              score = 50;
            }
          }
        } else if (tokens.length === 1) {
          if (compNorm.startsWith(tokens[0])) {
            score = 40;
          } else if (gameNorm.startsWith(tokens[0])) {
            score = 35;
          } else if (compNorm.includes(tokens[0]) || gameNorm.includes(tokens[0])) {
            score = 20;
          }
        }

        if (score > 0) {
          suggestions.push({
            company: companyName,
            game: gameName,
            url: record.url,
            username: record.username,
            label,
            score
          });
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 15);
  }

  public parseAndFindAccount(rawQuery: string): AccountRecord | null {
    if (!this.cache) return null;
    const query = normalizeKey(rawQuery);
    if (!query) return null;

    const suggestions = this.search(query);
    if (suggestions.length > 0 && suggestions[0].score >= 40) {
      const top = suggestions[0];
      return this.getExactAccount(top.company, top.game);
    }

    const parts = query.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const compTry = parts[0];
      const gameTry = parts.slice(1).join(' ');

      const compData = this.cache.companies.get(compTry);
      if (compData) {
        const exactGame = compData.games.get(gameTry);
        if (exactGame) return exactGame;

        for (const [gNorm, rec] of compData.games.entries()) {
          if (gNorm.startsWith(gameTry)) return rec;
        }
      }
    }

    return null;
  }

  public getExactAccount(company: string, game: string): AccountRecord | null {
    if (!this.cache) return null;
    const compNorm = normalizeKey(company);
    const gameNorm = normalizeKey(game);

    const compData = this.cache.companies.get(compNorm);
    if (!compData) return null;

    return compData.games.get(gameNorm) || null;
  }

  public getAccountPreview(company: string, game: string): AccountPreviewResponse | null {
    const acc = this.getExactAccount(company, game);
    if (!acc) return null;

    return {
      company: acc.company,
      game: acc.game,
      url: acc.url,
      username: acc.username,
      hasPassword: Boolean(acc.password),
      password: acc.password
    };
  }

  public getAllCompanies(): Array<{ name: string; gameCount: number }> {
    if (!this.cache) return [];
    return Array.from(this.cache.companies.values()).map((c) => ({
      name: c.companyName,
      gameCount: c.games.size
    }));
  }

  public getGamesForCompany(company: string): AccountRecord[] {
    if (!this.cache) return [];
    const compData = this.cache.companies.get(normalizeKey(company));
    if (!compData) return [];
    return Array.from(compData.games.values());
  }
}
