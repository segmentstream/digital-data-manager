import assert from 'assert';
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

  describe('initialization:', () => {

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

  });

  describe('working with events:', () => {

    const eventTemplate = {
      action: 'Added Product',
      category: 'Ecommerce'
    };

    it('should add time and hasFired fields to event', () => {
      let event = Object.assign({}, eventTemplate);

      ddManager.initialize();
      window.digitalData.events.push(event);

      assert.ok(window.digitalData.events.length == 1);
      assert.ok(window.digitalData.events[0].time > 100000);
      assert.ok(window.digitalData.events[0].hasFired);
    });

    it('should process callback for event', () => {
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      ddManager.initialize();

      window.ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);
      window.digitalData.events.push(event);

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });


    it('should process early callback for event', () => {
      window.digitalData = {
        events: []
      };
      window.ddListener = [];

      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      window.ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);

      ddManager.initialize();

      window.digitalData.events.push(event);

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });

    it('should process early callback for early event', () => {
      window.digitalData = {
        events: []
      };
      window.ddListener = [];

      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      window.ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);
      window.digitalData.events.push(event);

      ddManager.initialize();

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });

  });

  describe('#initialize', () => {
    it('should initialize DDManager instance', () => {
      ddManager.initialize();
      assert.ok(ddManager.isInitialized);
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
  });

});