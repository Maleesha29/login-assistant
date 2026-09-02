import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class BrowserManager {
  private browser: Browser | null = null;
  private activeContext: BrowserContext | null = null;
  private activePage: Page | null = null;

  public async getPage(options?: { headless?: boolean; slowMo?: number }): Promise<{ page: Page; context: BrowserContext; browser: Browser }> {
    const headless = options?.headless ?? (process.env.PLAYWRIGHT_HEADLESS === 'true');
    const slowMo = options?.slowMo ?? parseInt(process.env.PLAYWRIGHT_SLOW_MO || '50', 10);

    if (this.browser && this.browser.isConnected()) {
      try {
        if (!this.activeContext) {
          this.activeContext = await this.browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          });
        }
        const page = await this.activeContext.newPage();
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    this.activePage = await this.activeContext.newPage();
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
