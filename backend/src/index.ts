import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DataCacheService } from './services/dataCacheService';
import { AutomationService } from './services/automationService';
import { createRouter } from './api/routes';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

const dataCache = new DataCacheService();
const automationService = new AutomationService(dataCache);

app.use('/api', createRouter(dataCache, automationService));

app.get('/', (req, res) => {
  res.json({
    app: 'Login Assistant Backend',
    version: '1.0.0',
    status: 'running',
    apiDocs: '/api/status'
  });
});

async function start() {
  console.log('🚀 Initializing Login Assistant Backend...');

  try {
    await dataCache.init();
    const stats = dataCache.getStats();
    console.log('📊 Cached ' + stats.totalCompanies + ' companies and ' + stats.totalAccounts + ' accounts from: ' + stats.spreadsheetTitle);
  } catch (err: any) {
    // Not a fatal error — the user simply hasn\'t configured a Google Sheet yet.
    // The server starts normally and waits for a URL via the Settings panel.
    console.warn('⚠️  No data source configured yet. Server will start and wait for a Google Sheet URL via the Settings panel.');
  }

  app.listen(PORT, () => {
    console.log('⚡ Server listening locally on http://localhost:' + PORT);
  });
}

start();
