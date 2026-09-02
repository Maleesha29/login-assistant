import { Router, Request, Response } from 'express';
import { DataCacheService } from '../services/dataCacheService';
import { AutomationService } from '../services/automationService';
import { siteRegistry } from '../sites';
import { browserManager } from '../playwright/browserManager';
import { AutomationProgressEvent } from '../types';

export function createRouter(dataCache: DataCacheService, automationService: AutomationService): Router {
  const router = Router();

  router.get('/status', (req: Request, res: Response) => {
    try {
      const stats = dataCache.getStats();
      res.json({
        success: true,
        stats,
        browserOpen: browserManager.isBrowserOpen()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/search', (req: Request, res: Response) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const results = dataCache.search(query);
      res.json({
        success: true,
        query,
        count: results.length,
        results
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/account', (req: Request, res: Response) => {
    try {
      const company = typeof req.query.company === 'string' ? req.query.company : '';
      const game = typeof req.query.game === 'string' ? req.query.game : '';
      const sheetSource = typeof req.query.sheetSource === 'string' ? req.query.sheetSource : undefined;

      let account = dataCache.getAccountPreview(company, game, sheetSource);
      if (!account && (company || game)) {
        const found = dataCache.parseAndFindAccount(company + ' ' + game);
        if (found) {
          account = {
            company: found.company,
            game: found.game,
            url: found.url,
            username: found.username,
            hasPassword: Boolean(found.password),
            password: found.password,
            sheetSource: found.sheetSource
          };
        }
      }

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found for company: "' + company + '", game: "' + game + '"'
        });
      }

      res.json({ success: true, account });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/companies', (req: Request, res: Response) => {
    try {
      const companies = dataCache.getAllCompanies();
      res.json({ success: true, companies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/companies/:company/games', (req: Request, res: Response) => {
    try {
      const paramComp = req.params.company;
      const company = Array.isArray(paramComp) ? paramComp[0] : (paramComp || '');
      const games = dataCache.getGamesForCompany(company).map(g => ({
        company: g.company,
        game: g.game,
        url: g.url,
        username: g.username,
        hasPassword: Boolean(g.password),
        sheetSource: g.sheetSource
      }));
      res.json({ success: true, company, games });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/data/refresh - Reload Google Sheets (accepts multi-sheet or single-sheet payload)
  router.post('/data/refresh', async (req: Request, res: Response) => {
    try {
      const { sheetUrl, sheet1Url, sheet1Name, sheet2Url, sheet2Name } = req.body || {};
      await dataCache.refresh({ sheetUrl, sheet1Url, sheet1Name, sheet2Url, sheet2Name });
      res.json({
        success: true,
        message: 'Google Sheets cache reloaded successfully.',
        stats: dataCache.getStats()
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to reload Google Sheet: ' + err.message,
        stats: dataCache.getStats()
      });
    }
  });

  router.get('/sites', (req: Request, res: Response) => {
    res.json({
      success: true,
      sites: siteRegistry.listAll().map(s => ({
        companyOrDomain: s.companyOrDomain,
        description: s.description,
        isMultiStep: s.isMultiStep
      }))
    });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { company = '', game = '', sheetSource = '', keepBrowserOpen = true, headless = false } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event: AutomationProgressEvent) => {
      res.write('data: ' + JSON.stringify(event) + '\n\n');
    };

    try {
      await automationService.startLogin(
        company,
        game,
        (event) => sendEvent(event),
        { keepBrowserOpen, headless, sheetSource: sheetSource || undefined }
      );
      res.end();
    } catch (err: any) {
      sendEvent({
        step: 'ERROR',
        message: err.message || 'Login automation failed',
        progressPercent: 100,
        timestamp: new Date().toISOString(),
        error: err.message
      });
      res.end();
    }
  });

  router.post('/browser/close', async (req: Request, res: Response) => {
    await browserManager.closeBrowser();
    res.json({ success: true, message: 'Browser closed.' });
  });

  return router;
}
