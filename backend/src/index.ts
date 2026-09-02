import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DataCacheService } from './services/dataCacheService';
import { AutomationService } from './services/automationService';
import { createRouter } from './api/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  try {
    console.log('🚀 Initializing Login Assistant Backend...');
    await dataCache.init();
    const stats = dataCache.getStats();
    console.log('📊 Cached ' + stats.totalCompanies + ' companies and ' + stats.totalAccounts + ' accounts (Mock: ' + stats.isMockData + ').');

    app.listen(PORT, () => {
      console.log('⚡ Server listening locally on http://localhost:' + PORT);
    });
  } catch (err: any) {
    console.error('❌ Failed to start backend server:', err);
    process.exit(1);
  }
}

start();
