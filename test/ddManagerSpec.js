import assert from 'assert';
import nextTick from 'next-tick';
import reset from './reset.js';
import snippet from './snippet.js';
import availableIntegrations from '../src/availableIntegrations.js';
import ddManager from '../src/ddManager.js';
import Integration from '../src/Integration.js';

describe('DDManager', () => {

  afterEach(() => {
    ddManager.reset();
    reset();
  });

  describe('#initialize', () => {
    it('should initialize Array objects for window.digitalData.events and window.ddListener', () => {
      ddManager.initialize();
      assert.ok(Array.isArray(window.digitalData.events));
      assert.ok(Array.isArray(window.ddListener));
    });

    it('should work well with async load using stubs from the snippet', () => {
      snippet();
      window.ddManager.initialize();
      ddManager.processEarlyStubCalls();

      assert.ok(ddManager.isInitialized());
      assert.ok(Array.isArray(window.digitalData.events));
      assert.ok(Array.isArray(window.ddListener));
    });

    it('should initialize after all other stubs', (done) => {
      snippet();
      window.ddManager.initialize();
      window.ddManager.on('initialize', () => {
        done();
      });
      ddManager.processEarlyStubCalls();
    });

    it('should initialize DDManager instance', () => {
      ddManager.initialize();
      assert.ok(ddManager.isInitialized());
    });

    it('should add integration', () => {
      ddManager.setAvailableIntegrations(availableIntegrations);
      ddManager.initialize({
        integrations: {
          'Google Tag Manager': {
            componentId: 'XXX'
          }
        }
      });

      assert.ok(ddManager.getIntegration('Google Tag Manager') instanceof Integration);
    });

    it('it should fire on("ready") event even if ddManager was ready before', (done) => {
      ddManager.initialize();
      if (ddManager.isReady()) {
        ddManager.on('ready', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should fire once("ready") event even if ddManager was ready before', (done) => {
      ddManager.initialize();
      if (ddManager.isReady()) {
        ddManager.once('ready', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should fire on("initialize") event even if ddManager was initialized before', (done) => {
      ddManager.initialize();
      if (ddManager.isInitialized()) {
        ddManager.on('initialize', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should fire once("initialize") event even if ddManager was initialized before', (done) => {
      ddManager.initialize();
      if (ddManager.isInitialized()) {
        ddManager.once('initialize', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

  });

});