import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { SheetIndex } from '../types';
import { parseSheetTabs } from './sheetParser';

export const MOCK_SHEET_DATA: Array<{ tabName: string; rows: any[][] }> = [
  {
    tabName: 'HOLSPIN',
    rows: [
      ['GAME', 'WEBSITE', 'USERNAME', 'PASSWORD'],
      ['JILI', 'https://example.com/login', 'holspin_user1', 'SecretPass123!'],
      ['JULI', 'https://example.com/login', 'holspin_user2', 'SecretPass456!'],
      ['1XBET', 'https://example.com/auth', 'holspin_1xbet', 'HolspinPass789#'],
      ['PRAGMATIC', 'https://example.com/signin', 'holspin_prag', 'PragPass111$'],
      ['EVOLUTION', 'https://example.com/members', 'holspin_evo', 'EvoPass222%']
    ]
  },
  {
    tabName: 'BETSDOGGY',
    rows: [
      ['GAME', 'WEBSITE', 'USERNAME', 'PASSWORD'],
      ['JILI', 'https://example.com/doggy-jili', 'doggy_master', 'DoggyPass999!'],
      ['JULI', 'https://example.com/doggy-juli', 'doggy_juli', 'DoggyPass888@'],
      ['PGSOFT', 'https://example.com/pg', 'doggy_pg', 'DoggyPg333#'],
      ['SPADEGAMING', 'https://example.com/spade', 'doggy_spade', 'DoggySpade444$']
    ]
  },
  {
    tabName: 'BETWAY',
    rows: [
      ['GAME', 'WEBSITE', 'USERNAME', 'PASSWORD'],
      ['SLOTS', 'https://example.com/slots', 'betway_vip', 'BetwayPassVip1!'],
      ['LIVE_CASINO', 'https://example.com/live', 'betway_live', 'BetwayPassLive2@'],
      ['SPORTS', 'https://example.com/sports', 'betway_sports', 'BetwayPassSports3#']
    ]
  }
];

export class GoogleSheetsClient {
  private sheetIdOrUrl: string;

  constructor(customSheetIdOrUrl?: string) {
    this.sheetIdOrUrl = customSheetIdOrUrl || process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_URL || '';
  }

  public setSheetId(newIdOrUrl: string) {
    this.sheetIdOrUrl = newIdOrUrl;
  }

  public extractSpreadsheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    
    // Match /spreadsheets/d/<SPREADSHEET_ID>/
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // Otherwise return clean trimmed ID
    return trimmed;
  }

  public isConfigured(): boolean {
    const id = this.extractSpreadsheetId(this.sheetIdOrUrl);
    return Boolean(id && id !== 'YOUR_GOOGLE_SHEET_ID_HERE');
  }

  public async fetchSpreadsheetData(sheetOverride?: string): Promise<SheetIndex> {
    const rawInput = sheetOverride || this.sheetIdOrUrl;
    const spreadsheetId = this.extractSpreadsheetId(rawInput);

    // 1. Check if user configured a Google Spreadsheet ID or URL
    if (spreadsheetId && spreadsheetId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
      try {
        console.log('📡 Fetching Google Spreadsheet without Google Cloud (Zero-Cloud Mode)...');
        console.log('🔗 Spreadsheet ID: ' + spreadsheetId);

        const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
        
        const response = await fetch(exportUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Spreadsheet not found. Please verify your Google Sheet ID or URL.');
          } else if (response.status === 401 || response.status === 403 || response.redirected && response.url.includes('accounts.google.com')) {
            throw new Error('Spreadsheet is private. Please set sharing to "Anyone with the link can view" in Google Sheets.');
          } else {
            throw new Error(`Failed to download spreadsheet (HTTP ${response.status})`);
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

        const parsed = parseSheetTabs(tabsData, `Google Sheet (${spreadsheetId.substring(0, 10)}...)`);
        parsed.isMockData = false;
        console.log(`✅ Successfully loaded ${parsed.companies.size} company tabs and ${parsed.allAccounts.length} game accounts directly from Google Sheets!`);
        return parsed;
      } catch (err: any) {
        console.error('⚠️ Could not load online Google Sheet:', err.message);
        throw err;
      }
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

        const parsed = parseSheetTabs(tabsData, 'Local accounts.xlsx file');
        parsed.isMockData = false;
        console.log(`✅ Loaded ${parsed.companies.size} company tabs from local accounts.xlsx.`);
        return parsed;
      }
    }

    // 3. Fallback to mock dataset if nothing is provided
    console.log('ℹ️ No Google Sheet URL configured in .env. Using mock dataset for local testing.');
    const parsed = parseSheetTabs(MOCK_SHEET_DATA, 'Mock Gaming Accounts (Zero GCP Mode)');
    parsed.isMockData = true;
    return parsed;
  }
}
