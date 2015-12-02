import assert from 'assert';
import DDManager from '../src/DDManager.js';

describe('DDManager', () => {

  describe('initialization:', () => {
    let window = {};
    before(() => {
      new DDManager('digitalData', 'ddListener', window);
    });

    it('should initialize Array objects for window.digitalData.events and window.ddListener', () => {
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
      let window = {};
      let event = Object.assign({}, eventTemplate);

      new DDManager('digitalData', 'ddListener', window);

      window.digitalData.events.push(event);

      assert.ok(window.digitalData.events.length == 1);
      assert.ok(window.digitalData.events[0].time > 100000);
      assert.ok(window.digitalData.events[0].hasFired);
    });

    it('should process callback for event', () => {
      let window = {};
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      new DDManager('digitalData', 'ddListener', window);

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
      let window = {
        digitalData: {
          events: []
        },
        ddListener: []
      };
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      window.ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);

      new DDManager('digitalData', 'ddListener', window);

      window.digitalData.events.push(event);

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });

    it('should process early callback for early event', () => {
      let window = {
        digitalData: {
          events: []
        },
        ddListener: []
      };
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      window.ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);
      window.digitalData.events.push(event);

      new DDManager('digitalData', 'ddListener', window);
      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });
  });

});