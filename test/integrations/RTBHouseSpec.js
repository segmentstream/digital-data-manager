import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import RTBHouse from './../../src/integrations/RTBHouse.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: RTBHouse', () => {
  let rtbHouse;
  const options = {
    accountKey: '',
    customDeduplication: false
  };

  beforeEach(() => {
    window.digitalData = {};
    rtbHouse = new RTBHouse(window.digitalData, options);
    ddManager.addIntegration('RTBHouse', rtbHouse);
  });

  afterEach(() => {
    rtbHouse.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.equal(options.accountKey, rtbHouse.getOption('accountKey'));
        assert.equal(options.customDeduplication, rtbHouse.getOption('customDeduplication'));
      });
    });
  });

  describe('before loading', () => {
    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize();
        assert.ok(rtbHouse.isLoaded());
      });

      it('should not load any tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(!rtbHouse.load.calledOnce);
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.spy(rtbHouse, 'load');
      ddManager.once('ready', done);
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(() => {
      rtbHouse.load.restore();
    });

    describe('#onViewedPage', () => {
        // TODO:
    });

  });
});
