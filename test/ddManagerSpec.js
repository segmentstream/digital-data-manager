import assert from 'assert';
import reset from './reset.js';
import sinon from 'sinon';
import snippet from './snippet.js';
import ddManager from '../src/ddManager.js';
import Integration from '../src/Integration.js';
import availableIntegrations from '../src/availableIntegrations.js';

describe('DDManager', () => {

  beforeEach(() => {
    //
  });

  afterEach(() => {
    window.localStorage.clear();
    ddManager.reset();
    reset();
  });

  describe('#initialize', () => {
    it('should initialize Array objects for window.digitalData.events and window.ddListener', () => {
      ddManager.initialize();
      assert.ok(Array.isArray(window.digitalData.events));
      assert.ok(Array.isArray(window.ddListener));
    });

    it('should initialize website, page, user and cart objects', () => {
      ddManager.initialize();
      assert.ok(window.digitalData.website);
      assert.ok(window.digitalData.page);
      assert.ok(window.digitalData.user);
      assert.ok(window.digitalData.cart); // if page !== 'confirmation'
    });

    it('should work well with async load using stubs from the snippet', () => {
      snippet();
      window.ddManager.initialize();
      ddManager.processEarlyStubCalls(window.ddManager);

      assert.ok(ddManager.isReady());
      assert.ok(Array.isArray(window.digitalData.events));
      assert.ok(Array.isArray(window.ddListener));
    });

    it('should initialize after all other stubs', (done) => {
      snippet();
      window.ddManager.initialize();
      window.ddManager.on('ready', () => {
        done();
      });
      ddManager.processEarlyStubCalls(window.ddManager);
    });

    it('should initialize DDManager instance', () => {
      ddManager.initialize();
      assert.ok(ddManager.isReady());
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

    it('should add integration if old-style object settings without options', () => {
      ddManager.setAvailableIntegrations(availableIntegrations);
      ddManager.initialize({
        integrations: {
          'Google Tag Manager': true
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

    it('shoud set EventManager\'s sendViewedPageEvent value to true', () => {
      ddManager.initialize({ sendViewedPageEvent: true });
      assert.ok(ddManager.getEventManager().getSendViewedPageEvent());
    });

    it('shoud set EventManager\'s sendViewedPageEvent value to false', () => {
      ddManager.initialize();
      assert.ok(ddManager.getEventManager().getSendViewedPageEvent());
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
      if (ddManager.isReady()) {
        ddManager.on('ready', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should fire once("initialize") event even if ddManager was initialized before', (done) => {
      ddManager.initialize();
      if (ddManager.isReady()) {
        ddManager.once('ready', () => {
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('it should enrich digital data', (done) => {
      ddManager.initialize();
      if (ddManager.isReady()) {
        ddManager.once('ready', () => {
          assert.ok(window.digitalData.context.userAgent);
          done();
        });
      } else {
        assert.ok(false);
      }
    });

    it('should enrich digitalData based on semantic events', (done) => {
      window.digitalData = {
        user: {
          isSubscribed: false,
          isLoggedIn: true,
          hasTransacted: false
        }
      };

      ddManager.once('ready', () => {
        window.digitalData.events.push({
          name: 'Completed Transaction'
        });

        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@email.com'
          }
        });

        setTimeout(() => {
          assert.ok(window.digitalData.user.isLoggedIn);
          assert.ok(window.digitalData.user.everLoggedIn);
          assert.ok(window.digitalData.user.hasTransacted);
          assert.ok(window.digitalData.user.isSubscribed);
          assert.equal(window.digitalData.user.email, 'test@email.com');
          assert.ok(window.digitalData.user.lastTransactionDate);
          done();
        }, 101);
      });
      ddManager.initialize();
    });

    it('should update user.isReturning status', (done) => {
      window.localStorage.clear(); // just to be sure
      ddManager.once('ready', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window.digitalData.user.isReturning, 'isReturning should be false');
          }
        });

        setTimeout(() => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(window.digitalData.user.isReturning, 'isReturning should be true');
              done();
            }
          });
        }, 110);
      });
      ddManager.initialize({
        sessionLength: 0.1,
        sendViewedPageEvent: false
      });
    });

    it('should not update user.isReturning status', (done) => {
      ddManager.once('ready', () => {
        window.digitalData.events.push({
          name: 'Viewed Page'
        });

        assert.ok(!window.digitalData.user.isReturning);
        setTimeout(() => {
          window.digitalData.events.push({
            name: 'Viewed Page'
          });
          setTimeout(() => {
            assert.ok(!window.digitalData.user.isReturning);
            done();
          }, 110);
        }, 110);
      });
      ddManager.initialize({
        sessionLength: 20,
        sendViewedPageEvent: false
      });
    });
  });

  describe('exclude/include tracking', () => {

    const integration1 = new Integration(window.digitalData);
    const integration2 = new Integration(window.digitalData);
    const integration3 = new Integration(window.digitalData);

    integration1.allowCustomEvents =
    integration2.allowCustomEvents =
    integration3.allowCustomEvents = () => {
      return true;
    }

    beforeEach(() => {
      sinon.stub(integration1, 'trackEvent');
      sinon.stub(integration2, 'trackEvent');
      sinon.stub(integration3, 'trackEvent');

      window.localStorage.clear(); // clear
      ddManager.addIntegration('integration1', integration1);
      ddManager.addIntegration('integration2', integration2);
      ddManager.addIntegration('integration3', integration3);
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(() => {
      ddManager.reset();
      integration1.trackEvent.restore();
      integration2.trackEvent.restore();
      integration3.trackEvent.restore();
    });

    it('should not send event to integration1', (done) => {
      window.digitalData.events.push({
        name: 'Test',
        excludeIntegrations: ['integration1'],
        callback: () => {
          assert.ok(!integration1.trackEvent.called);
          assert.ok(integration2.trackEvent.called);
          assert.ok(integration3.trackEvent.called);
          done();
        }
      });
    });

    it('should not send event to integration1', (done) => {
      window.digitalData.events.push({
        name: 'Test',
        includeIntegrations: ['integration2', 'integration3'],
        callback: () => {
          assert.ok(!integration1.trackEvent.called);
          assert.ok(integration2.trackEvent.called);
          assert.ok(integration2.trackEvent.called);
          done();
        }
      });
    });

    it('should not send event at all', (done) => {
      window.digitalData.events.push({
        name: 'Test',
        includeIntegrations: ['integration2', 'integration3'],
        excludeIntegrations: ['integration1'],
        callback: () => {
          assert.ok(!integration1.trackEvent.called);
          assert.ok(!integration2.trackEvent.called);
          assert.ok(!integration2.trackEvent.called);
          done();
        }
      });
    });

    it('should not send Session Started event', () => {
      assert.ok(!integration1.trackEvent.called);
      assert.ok(!integration2.trackEvent.called);
      assert.ok(!integration2.trackEvent.called);
    });

  });

});
