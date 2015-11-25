import test from 'tape';
import DigitalDataHelper from '../src/DDManager.js';

function setup() {
  window.digitalData = {};
}

function tearDown() {

}

test('test globals', (t) => {
  setup();
  const ddlHelper = new DigitalDataHelper();

  t.plan(2);
  t.ok(Array.isArray(window.digitalData.events), 'window.digitalData.events should be Array object');
  t.ok(Array.isArray(window.ddListener), 'window.ddListener should be Array object');
});


test('test pushed events additional fields', (t) => {
  setup();
  const ddlHelper = new DigitalDataHelper();

  window.digitalData.events.push({
    action: 'Added Product',
    category: 'Ecommerce'
  });

  t.plan(3);
  t.ok(window.digitalData.events.length == 1, 'digitalData.events length should be = 1');
  t.ok(window.digitalData.events[0].time > 100000, 'event.time should be defined');
  t.ok(window.digitalData.events[0].hasFired, 'event.hasFired should be TRUE');
});

test('test event callback', (t) => {
  setup();
  const ddlHelper = new DigitalDataHelper();
  const event = {
    action: 'Added Product',
    category: 'Ecommerce'
  };
  let callbackFired = false;
  let receivedEvent;

  window.ddListener.push(['on', 'event', (e) => {
    callbackFired = true;
    receivedEvent = e;
  }]);

  window.digitalData.events.push(event);

  t.plan(3);
  t.ok(callbackFired, 'Callback function was not called');
  t.equal(receivedEvent.action, event.action, 'Incorrect event.action received inside callback');
  t.equal(receivedEvent.category, event.category, 'Incorrect event.category received inside callback');
});

test('test early event callback', (t) => {
  setup();
  const event = {
    action: 'Added Product',
    category: 'Ecommerce'
  };
  let callbackFired = false;
  let receivedEvent;

  window.ddListener.push(['on', 'event', (e) => {
    callbackFired = true;
    receivedEvent = e;
  }]);

  const ddlHelper = new DigitalDataHelper();

  window.digitalData.events.push(event);

  t.plan(3);
  t.ok(callbackFired, 'Callback function was not called');
  t.equal(receivedEvent.action, event.action, 'Incorrect event.action received inside callback');
  t.equal(receivedEvent.category, event.category, 'Incorrect event.category received inside callback');
});

test('test early event callback for early events', (t) => {
  setup();
  const event = {
    action: 'Added Product',
    category: 'Ecommerce'
  };
  let callbackFired = false;
  let receivedEvent;

  window.ddListener = [];
  window.ddListener.push(['on', 'event', (e) => {
    callbackFired = true;
    receivedEvent = e;
  }]);

  window.digitalData.events = [];
  window.digitalData.events.push(event);

  const ddlHelper = new DigitalDataHelper();

  t.plan(3);
  t.ok(callbackFired, 'Callback function was not called');
  t.equal(receivedEvent.action, event.action, 'Incorrect event.action received inside callback');
  t.equal(receivedEvent.category, event.category, 'Incorrect event.category received inside callback');
});