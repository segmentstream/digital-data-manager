import assert from 'assert';
import EventManager from './../../src/EventManager';
import fireEvent from './../functions/fireEvent';

describe('CustomEvents', () => {

  let _eventManager;
  let _digitalData;
  let _ddListener;

  let btn;
  let div;

  beforeEach(() => {
    _digitalData = {
      page: {
        categoryId: 1
      },
      type: 'product',
      events: [{
        name: 'Test Event'
      }]
    };
    _ddListener = [];
    _eventManager = new EventManager(_digitalData, _ddListener);
    _eventManager.setSendViewedPageEvent(true);

    // create button
    btn = document.createElement('button');
    const t = document.createTextNode('click me');
    btn.appendChild(t);
    btn.className = 'test-btn';

    // create div
    div = document.createElement('div');
    div.appendChild(btn);
    div.id = 'test-div';

    document.body.appendChild(div);
  });

  afterEach(() => {
    if (_eventManager) {
      _eventManager.reset();
      _eventManager = undefined;
    }

    div.parentNode.removeChild(div);
    _digitalData.events = [];
  });

  it('should track custom events', (done) => {
    let currentAssert = 'Viewed Page'
    const nextAssert = {
      'Viewed Page': 'Viewed Product Detail',
      'Viewed Product Detail': 'Test Event',
      'Viewed Product Detail': 'Clicked Product',
    };
    _eventManager.addCallback(['on', 'event', (event) => {
      assert.equal(event.name, currentAssert);
      if (event.name === 'Clicked Product') {
        done();
      } else {
        currentAssert = nextAssert[currentAssert];
      }
    }]);
    _eventManager.import([
      {
        name: 'Event: Viewed Product Detail',
        trigger: 'event',
        event: 'Viewed Page',
        handler: function(event) {
          assert.equal(event.name, 'Viewed Page');
          return {
            name: 'Viewed Product Detail',
          }
        }
      },
      {
        name: 'Event: Clicked Product',
        trigger: 'click',
        selector: '.test-btn',
        handler: function(element) {
          assert.ok(element);
          return {
            name: 'Clicked Product',
          };
        },
      },
      {
        name: 'Test Name',
        trigger: 'impression',
        selector: '.ddl_product',
        handler: function() {
          return {
            name: 'Viewed Product',
          };
        }
      }
    ]);
    _eventManager.initialize();

    fireEvent(btn, 'click');
  });
});
