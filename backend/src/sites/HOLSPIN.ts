import { defineSite } from './siteConfig';

export default defineSite({
  companyOrDomain: 'HOLSPIN',
  description: 'Custom selectors for Holspin platform',
  usernameSelector: [
    'input[name="username"]',
    'input[id="username"]',
    'input[placeholder*="username" i]',
    'input[type="text"]'
  ],
  passwordSelector: [
    'input[name="password"]',
    'input[id="password"]',
    'input[type="password"]'
  ],
  loginSelector: [
    'button[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")'
  ],
  waitAfterLogin: 3000
});
