import assert from 'assert';
import reset from './reset.js';
import snippet from './snippet.js';
import ddManager from '../src/ddManager.js';
import Integration from '../src/Integration.js';
import availableIntegrations from '../src/availableIntegrations.js';

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

    it('should add integration if old-style object settings', () => {
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

    it('should add integration if new array settings', () => {
      ddManager.setAvailableIntegrations(availableIntegrations);
      ddManager.initialize({
        integrations: [
          {
            'name': 'Google Tag Manager',
            'options': {
              'componentId': 'XXX'
            }
          }
        ]
      });

      assert.ok(ddManager.getIntegration('Google Tag Manager') instanceof Integration);
    });

    it('should add integration if new array settings without options', () => {
      ddManager.setAvailableIntegrations(availableIntegrations);
      ddManager.initialize({
        integrations: [
          {
            'name': 'Google Tag Manager'
          }
        ]
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

    it('it should fire fire "Viewed Page" event if autoEvents == true', (done) => {
      ddManager.initialize();
      if (ddManager.isInitialized()) {
        ddManager.once('initialize', () => {
          assert.ok(window.digitalData.events[0].name === 'Viewed Page');
          assert.ok(window.digitalData.events.length === 1);
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should fire fire "Viewed Page" event if autoEvents == true', (done) => {
      ddManager.initialize({
        autoEvents: false
      });
      if (ddManager.isInitialized()) {
        ddManager.once('initialize', () => {
          assert.ok(window.digitalData.events.length === 0);
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should enrich digital data', (done) => {
      ddManager.initialize();
      if (ddManager.isInitialized()) {
        ddManager.once('initialize', () => {
          assert.ok(window.digitalData.context.userAgent);
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should send Viewed Page event once', (done) => {
      ddManager.on('ready', () => {
        setTimeout(() => {
          assert.equal(window.digitalData.events.length, 2);
          done();
        }, 1000);
      });
      window.digitalData = {
        page: {
          type: 'product'
        },
        product: {
          id: '123'
        }
      };
      ddManager.setAvailableIntegrations(availableIntegrations);
      ddManager.initialize({
        autoEvents: true,
        integrations: {
          'Google Tag Manager': true,
          'SegmentStream': true,
        }
      });

    });
  });

});