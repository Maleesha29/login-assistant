import { chromium, Browser, BrowserContext, Page, Download } from 'playwright';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadRecord {
  id: string;
  filename: string;
  path: string;
  sizeBytes?: number;
  downloadedAt: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private activeContext: BrowserContext | null = null;
  private activePage: Page | null = null;
  private downloadsPath: string;
  private recentDownloads: DownloadRecord[] = [];

  constructor() {
    this.downloadsPath = process.env.DOWNLOADS_PATH || path.join(os.homedir(), 'Downloads');
    try {
      if (!fs.existsSync(this.downloadsPath)) {
        fs.mkdirSync(this.downloadsPath, { recursive: true });
      }
    } catch (e) {
      console.warn('⚠️ Could not verify/create downloads directory:', this.downloadsPath, e);
    }
  }

  public getDownloadsPath(): string {
    return this.downloadsPath;
  }

  public getRecentDownloads(): DownloadRecord[] {
    return [...this.recentDownloads];
  }

  private getUniqueFilePath(dir: string, filename: string): string {
    let targetPath = path.join(dir, filename);
    if (!fs.existsSync(targetPath)) return targetPath;

    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let counter = 1;
    while (fs.existsSync(path.join(dir, `${base} (${counter})${ext}`))) {
      counter++;
    }
    return path.join(dir, `${base} (${counter})${ext}`);
  }

  private setupPageDownloads(page: Page) {
    if ((page as any).__downloadsConfigured) return;
    (page as any).__downloadsConfigured = true;

    page.on('download', async (download: Download) => {
      try {
        const rawFilename = download.suggestedFilename() || `download_${Date.now()}`;
        const targetPath = this.getUniqueFilePath(this.downloadsPath, rawFilename);
        console.log(`📥 [Download Started] "${rawFilename}" -> saving to: ${targetPath}`);

        await download.saveAs(targetPath);

        let sizeBytes: number | undefined;
        try {
          if (fs.existsSync(targetPath)) {
            sizeBytes = fs.statSync(targetPath).size;
          }
        } catch {}

        const record: DownloadRecord = {
          id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          filename: path.basename(targetPath),
          path: targetPath,
          sizeBytes,
          downloadedAt: new Date().toISOString()
        };

        this.recentDownloads = [record, ...this.recentDownloads].slice(0, 20);
        console.log(`✅ [Download Finished] Saved to "${targetPath}" (${sizeBytes !== undefined ? `${sizeBytes} bytes` : 'complete'})`);
      } catch (err: any) {
        console.warn(`⚠️ [Download Failed]`, err?.message || err);
      }
    });
  }

  private setupContextDownloads(context: BrowserContext) {
    context.on('page', (newPage) => {
      this.setupPageDownloads(newPage);
    });
  }

  public async getPage(options?: { headless?: boolean; slowMo?: number }): Promise<{ page: Page; context: BrowserContext; browser: Browser }> {
    const headless = options?.headless ?? (process.env.PLAYWRIGHT_HEADLESS === 'true');
    const slowMo = options?.slowMo ?? parseInt(process.env.PLAYWRIGHT_SLOW_MO || '50', 10);

    if (this.browser && this.browser.isConnected()) {
      try {
        if (!this.activeContext) {
          this.activeContext = await this.browser.newContext({
            viewport: { width: 1280, height: 800 },
            acceptDownloads: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          });
          this.setupContextDownloads(this.activeContext);
        }
        const page = await this.activeContext.newPage();
        this.setupPageDownloads(page);
        this.activePage = page;
        return { page, context: this.activeContext, browser: this.browser };
      } catch (err) {
        console.log('🔄 Re-launching browser instance...');
        this.browser = null;
        this.activeContext = null;
      }
    }

    console.log('🌐 Launching Playwright Chromium (headless: ' + headless + ')...');
    this.browser = await chromium.launch({
      headless,
      slowMo,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });

    this.activeContext = await this.browser.newContext({
      viewport: null,
      acceptDownloads: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });
    this.setupContextDownloads(this.activeContext);

    this.activePage = await this.activeContext.newPage();
    this.setupPageDownloads(this.activePage);
    return { page: this.activePage, context: this.activeContext, browser: this.browser };
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {}
      this.browser = null;
      this.activeContext = null;
      this.activePage = null;
    }
  }

  public isBrowserOpen(): boolean {
    return Boolean(this.browser && this.browser.isConnected());
  }
}

export const browserManager = new BrowserManager();
