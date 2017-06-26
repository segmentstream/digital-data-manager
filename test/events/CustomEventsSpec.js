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
      events: []
    };
    _ddListener = [];
    _eventManager = new EventManager(_digitalData, _ddListener);
    _eventManager.setSendViewedPageEvent(true);

    // // create button
    // btn = document.createElement('button');
    // const t = document.createTextNode('click me');
    // btn.appendChild(t);
    // btn.className = 'test-btn';
    //
    // // create div
    // div = document.createElement('div');
    // div.appendChild(btn);
    // div.id = 'test-div';
    //
    // document.body.appendChild(div);
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
    _eventManager.import([
      {
        name: 'Event: Viewed Product Detail',
        trigger: 'event',
        event: 'Viewed Page',
        handler: function() {
          return {
            name: 'Viewed Product Detail',
          }
        }
      },
      // {
      //   name: 'Event: Clicked Product',
      //   trigger: 'click',
      //   cssSelector: '.test-btn',
      //   handler: function() {
      //     return {
      //       name: 'Clicked Product',
      //     };
      //   },
      // },
      // {
      //   name: 'Test Name',
      //   trigger: 'impression',
      //   cssSelector: '.ddl_product',
      //   handler: function() {
      //     return {
      //       name: 'Viewed Product',
      //     };
      //   }
      // }
    ]);
    _eventManager.initialize();

    // fireEvent(btn, 'click');

    setTimeout(() => {
      assert.equal(_digitalData.events[0].name, 'Viewed Page');
      assert.equal(_digitalData.events[1].name, 'Viewed Product Detail');
      // assert.equal(_digitalData.events[2].name, 'Clicked Product');
      done();
    }, 10);
  });
});
