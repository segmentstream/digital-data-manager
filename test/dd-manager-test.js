import test from 'tape';
import DigitalDataHelper from '../src/DDManager.js';

test('test globals', (t) => {
  window.digitalData = {
    page: {
      type: 'home'
    }
  };

  const ddlHelper = new DigitalDataHelper();

  t.plan(2);
  t.ok(Array.isArray(window.digitalData.events), 'window.digitalData.events should be Array object');
  t.ok(Array.isArray(window.ddListener), 'window.ddListener should be Array object');
});