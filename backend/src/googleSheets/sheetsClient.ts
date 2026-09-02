import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { SheetIndex } from '../types';
import { parseSheetTabs, mergeSheetIndexes } from './sheetParser';

export interface SheetConfigItem {
  idOrUrl: string;
  name: string;
}

export interface MultiSheetRefreshPayload {
  sheet1Url?: string;
  sheet1Name?: string;
  sheet2Url?: string;
  sheet2Name?: string;
  sheetUrl?: string; // Legacy single sheet parameter
}

export class GoogleSheetsClient {
  private sheet1: SheetConfigItem;
  private sheet2: SheetConfigItem;

  constructor() {
    this.sheet1 = {
      idOrUrl: process.env.GOOGLE_SHEET_ID_1 || process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_URL || '',
      name: process.env.GOOGLE_SHEET_NAME_1 || 'Sheet 1'
    };
    this.sheet2 = {
      idOrUrl: process.env.GOOGLE_SHEET_ID_2 || '',
      name: process.env.GOOGLE_SHEET_NAME_2 || 'Sheet 2'
    };
  }

  public setSheet1(idOrUrl: string, name?: string) {
    this.sheet1.idOrUrl = idOrUrl;
    if (name) this.sheet1.name = name;
  }

  public setSheet2(idOrUrl: string, name?: string) {
    this.sheet2.idOrUrl = idOrUrl;
    if (name) this.sheet2.name = name;
  }

  public getConfiguredSheets(): SheetConfigItem[] {
    const list: SheetConfigItem[] = [];
    if (this.extractSpreadsheetId(this.sheet1.idOrUrl)) {
      list.push({ ...this.sheet1 });
    }
    if (this.extractSpreadsheetId(this.sheet2.idOrUrl)) {
      list.push({ ...this.sheet2 });
    }
    return list;
  }

  public extractSpreadsheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    if (trimmed === 'YOUR_GOOGLE_SHEET_ID_HERE') return '';

    // Match /spreadsheets/d/<SPREADSHEET_ID>/
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    return trimmed;
  }

  public isConfigured(): boolean {
    return Boolean(
      this.extractSpreadsheetId(this.sheet1.idOrUrl) ||
      this.extractSpreadsheetId(this.sheet2.idOrUrl)
    );
  }

  /**
   * Fetches an individual Google Spreadsheet by ID or URL and tags records with sheetLabel
   */
  public async fetchSingleGoogleSheet(idOrUrl: string, sheetLabel: string): Promise<SheetIndex> {
    const spreadsheetId = this.extractSpreadsheetId(idOrUrl);
    if (!spreadsheetId) {
      throw new Error(`Invalid spreadsheet ID or URL for ${sheetLabel}.`);
    }

    console.log(`📡 Fetching Google Spreadsheet "${sheetLabel}" (Zero-Cloud Mode)...`);
    console.log(`🔗 Spreadsheet ID: ${spreadsheetId}`);

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Spreadsheet "${sheetLabel}" not found. Please verify the Sheet ID or URL.`);
      } else if (response.status === 401 || response.status === 403 || (response.redirected && response.url.includes('accounts.google.com'))) {
        throw new Error(`Spreadsheet "${sheetLabel}" is private. Please set sharing to "Anyone with the link can view".`);
      } else {
        throw new Error(`Failed to download spreadsheet "${sheetLabel}" (HTTP ${response.status})`);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse with SheetJS
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const tabsData: Array<{ tabName: string; rows: any[][] }> = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      tabsData.push({ tabName: sheetName, rows });
    }

    const parsed = parseSheetTabs(tabsData, `Google Sheet (${spreadsheetId.substring(0, 8)}...)`, sheetLabel);
    parsed.isMockData = false;
    console.log(`✅ Loaded ${parsed.companies.size} companies & ${parsed.allAccounts.length} accounts from "${sheetLabel}"!`);
    return parsed;
  }

  /**
   * Fetches all configured Google Spreadsheets (Sheet 1 and Sheet 2) and merges them
   */
  public async fetchSpreadsheetData(payload?: MultiSheetRefreshPayload | string): Promise<SheetIndex> {
    // Handle legacy string override or object payload
    let s1Url = this.sheet1.idOrUrl;
    let s1Name = this.sheet1.name;
    let s2Url = this.sheet2.idOrUrl;
    let s2Name = this.sheet2.name;

    if (typeof payload === 'string') {
      s1Url = payload;
    } else if (payload && typeof payload === 'object') {
      if (payload.sheet1Url !== undefined) s1Url = payload.sheet1Url;
      if (payload.sheet1Name) s1Name = payload.sheet1Name;
      if (payload.sheet2Url !== undefined) s2Url = payload.sheet2Url;
      if (payload.sheet2Name) s2Name = payload.sheet2Name;
      if (payload.sheetUrl && !payload.sheet1Url) s1Url = payload.sheetUrl;
    }

    // Update in-memory state
    this.sheet1 = { idOrUrl: s1Url, name: s1Name };
    this.sheet2 = { idOrUrl: s2Url, name: s2Name };

    const s1Id = this.extractSpreadsheetId(s1Url);
    const s2Id = this.extractSpreadsheetId(s2Url);

    // If online sheets configured, fetch them
    if (s1Id || s2Id) {
      const results: SheetIndex[] = [];
      const errors: string[] = [];

      if (s1Id) {
        try {
          const idx1 = await this.fetchSingleGoogleSheet(s1Id, s1Name);
          results.push(idx1);
        } catch (err: any) {
          errors.push(`Sheet 1 (${s1Name}): ${err.message}`);
        }
      }

      if (s2Id) {
        try {
          const idx2 = await this.fetchSingleGoogleSheet(s2Id, s2Name);
          results.push(idx2);
        } catch (err: any) {
          errors.push(`Sheet 2 (${s2Name}): ${err.message}`);
        }
      }

      if (results.length > 0) {
        const merged = mergeSheetIndexes(results);
        if (errors.length > 0) {
          console.warn('⚠️ Partial sheet loading warnings:', errors.join('; '));
        }
        return merged;
      }

      // If all configured sheets failed
      throw new Error(errors.join(' | '));
    }

    // 2. Check for local accounts.xlsx file in root or backend directory
    const possiblePaths = [
      path.resolve(process.cwd(), 'accounts.xlsx'),
      path.resolve(process.cwd(), '..', 'accounts.xlsx')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log('📂 Found local Excel file at: ' + p);
        const buffer = fs.readFileSync(p);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const tabsData: Array<{ tabName: string; rows: any[][] }> = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          tabsData.push({ tabName: sheetName, rows });
        }

        const parsed = parseSheetTabs(tabsData, 'Local accounts.xlsx file', 'Local File');
        parsed.isMockData = false;
        console.log(`✅ Loaded ${parsed.companies.size} company tabs from local accounts.xlsx.`);
        return parsed;
      }
    }

    // 3. No source configured
    throw new Error(
      'No data source configured. Please provide Google Sheet URLs via the Settings panel or place an accounts.xlsx file in the project root.'
    );
  }
}
