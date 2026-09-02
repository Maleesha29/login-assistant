import { Page } from 'playwright';
import { AccountRecord, AutomationProgressEvent, SiteLoginConfig, SiteStepAction } from '../types';
import { siteRegistry } from '../sites';

export type ProgressCallback = (event: AutomationProgressEvent) => void;

const USERNAME_SELECTORS = [
  'input[type="email"]',
  'input[name="email"]',
  'input[name="username"]',
  'input[name="user"]',
  'input[name="login"]',
  'input[name="account"]',
  'input[id="email"]',
  'input[id="username"]',
  'input[id="user"]',
  'input[id="login"]',
  'input[id="account"]',
  'input[autocomplete="username"]',
  'input[autocomplete="email"]',
  'input[placeholder*="username" i]',
  'input[placeholder*="user" i]',
  'input[placeholder*="email" i]',
  'input[placeholder*="account" i]',
  'input[placeholder*="phone" i]',
  'input[type="text"]:visible',
  'input:not([type="hidden"]):not([type="password"]):not([type="checkbox"]):not([type="radio"]):visible'
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  'input[name="passwd"]',
  'input[name="pwd"]',
  'input[id="password"]',
  'input[id="passwd"]',
  'input[id="pwd"]',
  'input[autocomplete="current-password"]',
  'input[autocomplete="password"]',
  'input[placeholder*="password" i]',
  'input[placeholder*="pass" i]'
];

const LOGIN_BUTTON_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button:has-text("Log In")',
  'button:has-text("Sign in")',
  'button:has-text("Signin")',
  'button:has-text("Sign In")',
  'button:has-text("Masuk")',
  'button:has-text("Submit")',
  'a:has-text("Log in")',
  'a:has-text("Login")',
  'a:has-text("Sign in")',
  '[role="button"]:has-text("Log in")',
  '[role="button"]:has-text("Sign in")',
  '.login-btn',
  '#login-btn'
];

const NEXT_BUTTON_SELECTORS = [
  'button:has-text("Next")',
  'button:has-text("Continue")',
  'button:has-text("Selanjutnya")',
  'input[value="Next"]',
  'button[type="submit"]'
];

export async function executeLoginAutomation(
  page: Page,
  account: AccountRecord,
  onProgress: ProgressCallback
): Promise<void> {
  const emit = (step: AutomationProgressEvent['step'], message: string, percent: number, error?: string) => {
    onProgress({
      step,
      message,
      progressPercent: percent,
      timestamp: new Date().toISOString(),
      error
    });
  };

  try {
    emit('OPENING_WEBSITE', 'Navigating to ' + account.url + '...', 30);

    await page.goto(account.url, {
      waitUntil: 'domcontentloaded',
      timeout: parseInt(process.env.LOGIN_TIMEOUT_MS || '30000', 10)
    });

    await page.waitForTimeout(1000);

    const siteConfig = siteRegistry.findConfig(account.company, account.url);

    if (siteConfig) {
      emit('OPENING_WEBSITE', 'Using custom site profile for ' + siteConfig.companyOrDomain, 40);
      if (siteConfig.customSteps && siteConfig.customSteps.length > 0) {
        await executeCustomSteps(page, siteConfig.customSteps, account, emit);
        const waitMs = siteConfig.waitAfterLogin || 3000;
        await page.waitForTimeout(waitMs);
        emit('LOGIN_COMPLETED', 'Login completed successfully via site profile.', 100);
        return;
      }
    }

    await executeGenericLogin(page, account, siteConfig, emit);

    const waitMs = siteConfig?.waitAfterLogin || 3000;
    await page.waitForTimeout(waitMs);
    emit('LOGIN_COMPLETED', 'Login completed successfully.', 100);
  } catch (err: any) {
    const errorMsg = err.message || 'Unknown browser automation error';
    console.error('❌ Automation failure:', errorMsg);
    emit('ERROR', 'Automation error: ' + errorMsg, 100, errorMsg);
    throw err;
  }
}

async function executeGenericLogin(
  page: Page,
  account: AccountRecord,
  siteConfig: SiteLoginConfig | null,
  emit: (step: AutomationProgressEvent['step'], message: string, percent: number) => void
) {
  emit('ENTERING_USERNAME', 'Detecting username/email field...', 50);

  const usernameSelectors = siteConfig?.usernameSelector
    ? (Array.isArray(siteConfig.usernameSelector) ? siteConfig.usernameSelector : [siteConfig.usernameSelector])
    : USERNAME_SELECTORS;

  const usernameInput = await findFirstVisibleElement(page, usernameSelectors, 7000);
  if (!usernameInput) {
    throw new Error('Could not find username or email input field on the page.');
  }

  await usernameInput.click();
  await usernameInput.fill('');
  await usernameInput.fill(account.username);
  emit('ENTERING_USERNAME', 'Filled username (' + account.username + ')', 65);

  emit('ENTERING_PASSWORD', 'Detecting password field...', 70);

  const passwordSelectors = siteConfig?.passwordSelector
    ? (Array.isArray(siteConfig.passwordSelector) ? siteConfig.passwordSelector : [siteConfig.passwordSelector])
    : PASSWORD_SELECTORS;

  let passwordInput = await findFirstVisibleElement(page, passwordSelectors, 2000);

  if (!passwordInput) {
    emit('ENTERING_USERNAME', 'Multi-step login detected. Clicking next...', 72);
    const nextBtn = await findFirstVisibleElement(page, NEXT_BUTTON_SELECTORS, 3000);
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
    }
    passwordInput = await findFirstVisibleElement(page, passwordSelectors, 8000);
  }

  if (!passwordInput) {
    throw new Error('Could not find password input field on the page.');
  }

  if (account.password) {
    await passwordInput.click();
    await passwordInput.fill('');
    await passwordInput.fill(account.password);
    emit('ENTERING_PASSWORD', 'Filled password.', 85);
  } else {
    emit('ENTERING_PASSWORD', 'No password provided; skipped password entry.', 85);
  }

  emit('SUBMITTING_LOGIN', 'Detecting login button and submitting...', 90);

  const loginSelectors = siteConfig?.loginSelector
    ? (Array.isArray(siteConfig.loginSelector) ? siteConfig.loginSelector : [siteConfig.loginSelector])
    : LOGIN_BUTTON_SELECTORS;

  const loginButton = await findFirstVisibleElement(page, loginSelectors, 4000);

  if (loginButton) {
    await loginButton.click();
  } else {
    emit('SUBMITTING_LOGIN', 'Login button not found directly; pressing Enter on password field...', 92);
    await passwordInput.press('Enter');
  }

  emit('SUBMITTING_LOGIN', 'Submitted login. Waiting for page response...', 95);
}

async function executeCustomSteps(
  page: Page,
  steps: SiteStepAction[],
  account: AccountRecord,
  emit: (step: AutomationProgressEvent['step'], message: string, percent: number) => void
) {
  const stepCount = steps.length;
  for (let i = 0; i < stepCount; i++) {
    const step = steps[i];
    const pct = 40 + Math.round(((i + 1) / stepCount) * 55);
    emit('ENTERING_USERNAME', step.description || ('Executing custom step ' + (i + 1) + '/' + stepCount), pct);

    try {
      switch (step.action) {
        case 'waitForSelector':
          if (step.selector) {
            await page.waitForSelector(step.selector, { timeout: step.timeoutMs || 8000, state: 'visible' });
          }
          break;

        case 'fill':
          if (step.selector) {
            const el = await page.waitForSelector(step.selector, { timeout: step.timeoutMs || 8000 });
            if (el) {
              await el.click();
              await el.fill('');
              let val = step.customValue || '';
              if (step.valueType === 'username') val = account.username;
              if (step.valueType === 'password') val = account.password || '';
              await el.fill(val);
            }
          }
          break;

        case 'click':
          if (step.selector) {
            const el = await page.waitForSelector(step.selector, { timeout: step.timeoutMs || 8000 });
            if (el) await el.click();
          }
          break;

        case 'wait':
          await page.waitForTimeout(step.timeoutMs || 1000);
          break;

        case 'pressKey':
          if (step.customValue) {
            await page.keyboard.press(step.customValue);
          }
          break;
      }
    } catch (stepErr: any) {
      if (step.optional) {
        console.log('⚠️ Optional step ' + (i + 1) + ' skipped: ' + stepErr.message);
      } else {
        throw stepErr;
      }
    }
  }
}

async function findFirstVisibleElement(
  page: Page,
  selectors: string[],
  timeoutMs: number = 3000
) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    for (const selector of selectors) {
      try {
        const locator = page.locator(selector).first();
        const count = await locator.count();
        if (count > 0 && await locator.isVisible()) {
          return locator;
        }
      } catch (e) {
      }
    }
    await page.waitForTimeout(200);
  }

  return null;
}
