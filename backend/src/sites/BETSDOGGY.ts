import { defineSite } from './siteConfig';

export default defineSite({
  companyOrDomain: 'BETSDOGGY',
  description: 'Multi-step login support for BetsDoggy',
  isMultiStep: true,
  customSteps: [
    {
      action: 'waitForSelector',
      selector: 'input[type="text"], input[type="email"], input[name="username"], input[name="user"]',
      description: 'Waiting for username field'
    },
    {
      action: 'fill',
      selector: 'input[type="text"], input[type="email"], input[name="username"], input[name="user"]',
      valueType: 'username',
      description: 'Entering username'
    },
    {
      action: 'pressKey',
      customValue: 'Tab',
      description: 'Tab to password field'
    },
    {
      action: 'fill',
      selector: 'input[type="password"], input[name="password"]',
      valueType: 'password',
      description: 'Entering password'
    },
    {
      action: 'click',
      selector: 'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")',
      description: 'Submitting login button'
    }
  ],
  waitAfterLogin: 3500
});
