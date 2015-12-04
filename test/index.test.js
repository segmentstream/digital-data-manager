import 'core-js/es5';
import 'core-js/es6/object';
import 'core-js/es6/array';
import assert from 'assert';
import reset from './reset.js';
import snippet from './snippet.js';
import availableIntegrations from '../src/availableIntegrations.js';
import DDManager from '../src/DDManager.js';
import Integration from '../src/Integration.js';

//other tests
import './integrations/GoogleTagManagerSpec.js'

describe('DDManager', () => {
  afterEach(() => {
    reset();
  });

  describe('initialization:', () => {

    it('should initialize Array objects for window.digitalData.events and window.ddListener', () => {
      new DDManager();
      assert.ok(Array.isArray(window.digitalData.events));
      assert.ok(Array.isArray(window.ddListener));
    });

    it('should work well with async load', () => {
      snippet();
      window.ddManager.initialize();
      window.ddManager = new DDManager();
      ddManager.processEarlyStubCalls();

      assert.ok(window.ddManager.isInitialized);
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

      new DDManager();

      window.digitalData.events.push(event);

      assert.ok(window.digitalData.events.length == 1);
      assert.ok(window.digitalData.events[0].time > 100000);
      assert.ok(window.digitalData.events[0].hasFired);
    });

    it('should process callback for event', () => {
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      new DDManager();

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

      new DDManager();

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

      new DDManager();

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });

  });

  describe('#initialize', () => {
    it('should initialize DDManager instance', () => {
      let ddManager = new DDManager();
      ddManager.initialize();

      assert.ok(ddManager.isInitialized);
    });

    it('should add integration', () => {
      DDManager.setAvailableIntegrations(availableIntegrations);
      let ddManager = new DDManager();
      ddManager.initialize({
        integrations: {
          'Google Tag Manager': {
            componentId: 'XXX'
          }
        }
      });

      assert.ok(ddManager.integrations['Google Tag Manager'] instanceof Integration);
    });
  });

});