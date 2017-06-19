import assert from 'assert';
import sinon from 'sinon';
import deleteProperty from './../../src/functions/deleteProperty.js';
import CustomEnrichments from './../../src/enrichments/CustomEnrichments.js';
import Storage from './../../src/Storage.js';
import DDStorage from './../../src/DDStorage.js';

describe('CustomEnrichments', () => {

  let digitalData = {
    changes: [],
  };
  let ddStorage = new DDStorage(digitalData, new Storage());
  let customEnrichments = new CustomEnrichments(ddStorage);

  beforeEach(() => {
    ddStorage = new DDStorage(digitalData, new Storage());
  });

  it.only('should enrich digitalData', () => {
    customEnrichments.addEnrichment('digitalData', 'user.hasTransacted', function() {
      this.getQueryParam('test');
      this.get('user.test');
      this.getCookie('test');
      return true;
    }, {
      events: ['Completed Transaction'],
      persist: true,
      persistTtl: 3600
    });

    customEnrichments.enrichDigitalData(digitalData, { name: 'Completed Transaction'});
    assert.deepEqual(digitalData.changes[0], ['user.hasTransacted', true, 'DDManager Custom Enrichment']);
  });

});
