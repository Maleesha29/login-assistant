import { DataCacheService } from './services/dataCacheService';
import { parseSheetTabs } from './googleSheets/sheetParser';
import { siteRegistry } from './sites';

const TEST_FIXTURE_DATA = [
  {
    tabName: 'HOLSPIN',
    rows: [
      ['GAME', 'WEBSITE', 'USERNAME', 'PASSWORD'],
      ['JILI', 'https://example.com/login', 'holspin_user1', 'SecretPass123!'],
      ['JULI', 'https://example.com/login', 'holspin_user2', 'SecretPass456!']
    ]
  }
];

async function runTests() {
  console.log('🧪 Running Backend Unit & Integration Tests...');

  console.log('\n[1/2] Testing Sheet Parser & Normalization...');
  const index = parseSheetTabs(TEST_FIXTURE_DATA, 'Test Sheet');
  if (index.companies.size !== 1) {
    throw new Error('Expected 1 company, got ' + index.companies.size);
  }
  console.log('Accounts parsed: ' + index.allAccounts.length);
  console.log('✅ Sheet Parser parsed tabs and rows correctly.');

  console.log('\n[2/4] Testing Forgiving Search Engine...');
  const dataCache = new DataCacheService();
  await dataCache.init();

  // Test exact "HOLSPIN JILI"
  let results = dataCache.search('HOLSPIN JILI');
  if (!results.length || results[0].company !== 'HOLSPIN' || results[0].game !== 'JILI') {
    throw new Error('Search failed for "HOLSPIN JILI"');
  }

  // Test case insensitivity "holspin jili"
  results = dataCache.search('holspin jili');
  if (!results.length || results[0].game !== 'JILI') {
    throw new Error('Case-insensitive search failed for "holspin jili"');
  }

  // Test prefix "HOLSPIN JI" -> should match JILI
  results = dataCache.search('HOLSPIN JI');
  if (!results.some(r => r.game === 'JILI')) {
    throw new Error('Prefix autocomplete failed for "HOLSPIN JI" matching JILI');
  }

  // Test prefix "HOLSPIN J" -> should match both JILI and JULI
  results = dataCache.search('HOLSPIN J');
  if (!results.some(r => r.game === 'JILI') || !results.some(r => r.game === 'JULI')) {
    throw new Error('Prefix autocomplete failed for "HOLSPIN J" matching JILI and JULI');
  }

  // Test single token "jili" across companies
  results = dataCache.search('jili');
  if (results.length < 2) {
    throw new Error('Cross-company game search failed for "jili"');
  }
  console.log('✅ Search engine passed all forgiving and autocomplete test cases.');

  console.log('\n[3/4] Testing Account Preview Retrieval & Masking...');
  const preview = dataCache.getAccountPreview('HOLSPIN', 'JILI');
  if (!preview || preview.username !== 'holspin_user1' || !preview.hasPassword) {
    throw new Error('Failed to retrieve preview for HOLSPIN JILI');
  }
  console.log('✅ Account preview retrieval succeeded.');

  console.log('\n[4/4] Testing Site Registry Configuration...');
  const holspinSite = siteRegistry.findConfig('HOLSPIN', 'https://example.com');
  if (!holspinSite || holspinSite.companyOrDomain !== 'HOLSPIN') {
    throw new Error('Failed to find custom site config for HOLSPIN');
  }
  console.log('✅ Site registry resolved site configuration.');

  console.log('\n🎉 All tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
