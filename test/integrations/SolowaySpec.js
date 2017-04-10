import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Soloway from './../../src/integrations/Soloway.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Soloway', () => {
  let soloway;
  const options = {
    siteId: '123',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    soloway = new Soloway(window.digitalData, options);
    ddManager.addIntegration('Soloway', soloway);
  });
});
