import { DataCacheService } from './dataCacheService';
import { browserManager } from '../playwright/browserManager';
import { executeLoginAutomation, ProgressCallback } from '../playwright/genericAutomation';
import { AccountRecord, AutomationProgressEvent } from '../types';

export class AutomationService {
  constructor(private dataCache: DataCacheService) {}

  public async startLogin(
    companyQuery: string,
    gameQuery: string,
    onProgress: ProgressCallback,
    options?: { keepBrowserOpen?: boolean; headless?: boolean }
  ): Promise<AccountRecord> {
    const emit = (step: AutomationProgressEvent['step'], message: string, percent: number, error?: string) => {
      onProgress({
        step,
        message,
        progressPercent: percent,
        timestamp: new Date().toISOString(),
        error
      });
    };

    emit('INIT', 'Searching for company and game in Google Sheets data...', 5);

    emit('FINDING_COMPANY', 'Looking up company "' + companyQuery + '"...', 10);
    emit('FINDING_GAME', 'Looking up game "' + gameQuery + '"...', 15);

    let account = this.dataCache.getExactAccount(companyQuery, gameQuery);

    if (!account) {
      account = this.dataCache.parseAndFindAccount(companyQuery + ' ' + gameQuery);
    }

    if (!account) {
      const err = 'Could not find account for Company "' + companyQuery + '" and Game "' + gameQuery + '".';
      emit('ERROR', err, 100, err);
      throw new Error(err);
    }

    if (!account.url) {
      const err = 'Account found for "' + account.company + ' / ' + account.game + '", but no website URL is specified in the sheet.';
      emit('ERROR', err, 100, err);
      throw new Error(err);
    }

    emit('ACCOUNT_FOUND', 'Found account: ' + account.company + ' / ' + account.game + ' (' + account.url + ')', 20);

    emit('LAUNCHING_BROWSER', 'Launching Chromium browser...', 25);
    const { page } = await browserManager.getPage({
      headless: options?.headless
    });

    await executeLoginAutomation(page, account, onProgress);

    const keepOpen = options?.keepBrowserOpen ?? (process.env.KEEP_BROWSER_OPEN !== 'false');
    if (!keepOpen) {
      setTimeout(async () => {
        try {
          await browserManager.closeBrowser();
        } catch (e) {}
      }, 2000);
    }

    return account;
  }
}
