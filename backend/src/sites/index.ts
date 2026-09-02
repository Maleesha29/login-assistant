import { SiteLoginConfig } from '../types';
import holspinConfig from './HOLSPIN';
import betsdoggyConfig from './BETSDOGGY';

class SiteRegistry {
  private configs = new Map<string, SiteLoginConfig>();

  constructor() {
    this.register(holspinConfig);
    this.register(betsdoggyConfig);
  }

  public register(config: SiteLoginConfig): void {
    const key = config.companyOrDomain.trim().toLowerCase();
    this.configs.set(key, config);
  }

  public findConfig(company: string, url: string): SiteLoginConfig | null {
    const compKey = company.trim().toLowerCase();
    if (this.configs.has(compKey)) {
      return this.configs.get(compKey)!;
    }

    if (url) {
      try {
        const parsed = new URL(url.startsWith('http') ? url : ('https://' + url));
        const hostname = parsed.hostname.toLowerCase();
        for (const [key, cfg] of this.configs.entries()) {
          if (hostname.includes(key)) {
            return cfg;
          }
        }
      } catch (e) {}
    }

    return null;
  }

  public listAll(): SiteLoginConfig[] {
    return Array.from(this.configs.values());
  }
}

export const siteRegistry = new SiteRegistry();
