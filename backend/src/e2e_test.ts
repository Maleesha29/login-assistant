import http from 'http';
import { DataCacheService } from './services/dataCacheService';
import { AutomationService } from './services/automationService';
import { browserManager } from './playwright/browserManager';

async function runE2ETest() {
  console.log('🚀 Starting Local End-to-End Playwright Automation Test...');

  let loginReceivedUsername = '';
  let loginReceivedPassword = '';

  // 1. Create a local mock gaming website with a login form
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/submit-login') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const params = new URLSearchParams(body);
        loginReceivedUsername = params.get('username') || '';
        loginReceivedPassword = params.get('password') || '';
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Welcome to Holspin Game Lobby! Login Successful.</h1>');
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Holspin Gaming Platform Login</title></head>
      <body style="background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
        <form action="/submit-login" method="POST" id="login-form" style="background: #222; padding: 30px; border-radius: 8px;">
          <h2>Holspin JILI Login</h2>
          <div style="margin-bottom: 15px;">
            <label>Username:</label><br/>
            <input type="text" name="username" id="username" placeholder="Enter username" style="width: 100%; padding: 8px; margin-top: 5px;" />
          </div>
          <div style="margin-bottom: 15px;">
            <label>Password:</label><br/>
            <input type="password" name="password" id="password" placeholder="Enter password" style="width: 100%; padding: 8px; margin-top: 5px;" />
          </div>
          <button type="submit" id="submit-btn" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Log in
          </button>
        </form>
      </body>
      </html>
    `);
  });

  const testPort = 3999;
  await new Promise<void>((resolve) => server.listen(testPort, () => resolve()));
  const testUrl = `http://localhost:${testPort}/login`;
  console.log(`🌐 Local mock login site running at ${testUrl}`);

  try {
    // 2. Initialize Data Cache and mock account URL
    const dataCache = new DataCacheService();
    await dataCache.init();
    
    // Inject the local test URL into HOLSPIN JILI account for this E2E test
    const exactAccount = dataCache.getExactAccount('HOLSPIN', 'JILI');
    if (exactAccount) {
      exactAccount.url = testUrl;
    }

    const automationService = new AutomationService(dataCache);
    const stepsReceived: string[] = [];

    // 3. Execute Automation
    console.log('🤖 Executing Playwright automation against mock site...');
    await automationService.startLogin(
      'HOLSPIN',
      'JILI',
      (event) => {
        stepsReceived.push(event.step);
        console.log(`   [${event.step}] ${event.message} (${event.progressPercent}%)`);
      },
      { headless: true, keepBrowserOpen: false }
    );

    // 4. Verify Credentials submitted
    console.log('\n🔍 Verifying results...');
    if (loginReceivedUsername !== 'holspin_user1') {
      throw new Error(`Expected username "holspin_user1", received "${loginReceivedUsername}"`);
    }
    if (loginReceivedPassword !== 'SecretPass123!') {
      throw new Error(`Expected password "SecretPass123!", received "${loginReceivedPassword}"`);
    }

    if (!stepsReceived.includes('LOGIN_COMPLETED')) {
      throw new Error('Automation did not complete successfully');
    }

    console.log('✅ Form filled and submitted with matching credentials!');
    console.log('🎉 Full End-to-End Automation Test Passed!');
  } finally {
    server.close();
    await browserManager.closeBrowser();
  }
}

runE2ETest().catch((err) => {
  console.error('❌ E2E Test failed:', err);
  process.exit(1);
});
