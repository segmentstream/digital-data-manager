import assert from 'assert';
import reset from './reset.js';
import EventManager from './../src/EventManager.js';
import AutoEvents from './../src/AutoEvents.js';

describe('EventManager', () => {

  let _eventManager;

  afterEach(() => {
    if (_eventManager) {
      _eventManager.reset();
      _eventManager = undefined;
    }
    reset();
  });

  describe('working with events:', () => {

    const eventTemplate = {
      action: 'Added Product',
      category: 'Ecommerce'
    };

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      window.ddListener = [];
      _eventManager = new EventManager(window.digitalData, window.ddListener);
    });

    it('should add time and hasFired fields to event', () => {
      let event = Object.assign({}, eventTemplate);

      _eventManager.initialize();

      window.digitalData.events.push(event);

      assert.ok(window.digitalData.events.length == 1);
      assert.ok(window.digitalData.events[0].time > 100000);
      assert.ok(window.digitalData.events[0].hasFired);
    });

    it('should process callback for event', () => {
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      _eventManager.initialize();

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
      let event = Object.assign({}, eventTemplate);

      window.ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        assert.equal(e.action, event.action);
        assert.equal(e.category, event.category);
      }]);

      _eventManager.initialize();

      window.digitalData.events.push(event);
    });

    it('should process early callback for early event', () => {
      let event = Object.assign({}, eventTemplate);

      window.ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        assert.equal(e.action, event.action);
        assert.equal(e.category, event.category);
      }]);
      window.digitalData.events.push(event);

      _eventManager.initialize();
    });

    it('should fire event with callback inside when no listeners', (done) => {
      _eventManager.initialize();
      window.digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: function(result) {
          done();
        }
      });
    });

    it('should fire event with callback inside after listeners completed', (done) => {
      _eventManager.initialize();

      window.ddListener.push(['on', 'event', (e) => {
        return 'test result';
      }]);

      window.digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: (results) => {
          assert.ok(results[0] == 'test result');
          done();
        }
      });
    });

    it('should enrich product data from DDL', (done) => {
      window.digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      window.ddListener.push(['on', 'event', (e) => {
        assert(e.product.name === 'Test Product');
        done();
      }]);

      window.digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should not enrich product data from DDL', (done) => {
      window.digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      window.ddListener.push(['on', 'event', (e) => {
        assert(!e.product.name);
        done();
      }]);

      window.digitalData.events.push({
        name: 'Clicked Product',
        enrichEventData: false,
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should process past events event if listener was added later', (done) => {
      _eventManager.initialize();

      window.digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: {
          id: '123',
          name: 'Test Product'
        }
      });

      window.ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        done();
      }]);
    });

  });

  describe(': listening for digitalData changes', () => {

    beforeEach(() => {
      window.digitalData = {
        user: {
          returning: false
        },
        listing: {
          items: [
            {id: 1},
            {id: 2}
          ]
        },
        test: 'test'
      };
      window.ddListener = [];
      _eventManager = new EventManager(window.digitalData, window.ddListener);
      _eventManager.initialize();
    });

    it('should fire change callback', (done) => {
      window.ddListener.push(['on', 'change', () => {
        done();
      }]);
      window.digitalData.test2 = 'test2';
    });

    it('should fire change key callback', (done) => {
      window.ddListener.push(['on', 'change:user.returning', (newValue, previousValue) => {
        assert.ok(newValue === true);
        assert.ok(previousValue === false);
        done();
      }]);
      window.digitalData.user.returning = true;
    });

    it('should fire change callback for array', (done) => {
      window.ddListener.push(['on', 'change:listing.items', (newValue, previousValue) => {
        assert.ok(newValue.length === 3);
        assert.ok(previousValue.length === 2);
        done();
      }]);
      window.digitalData.listing.items.push({id: 3});
    });

    it('should fire length change callback for array', (done) => {
      window.ddListener.push(['on', 'change:listing.items.length', (newValue, previousValue) => {
        assert.ok(newValue === 3);
        assert.ok(previousValue === 2);
        done();
      }]);
      window.digitalData.listing.items.push({id: 3});
    });

    it('should fire change callbacks asynchronously, ignoring possible exceptions', (done) => {
      window.ddListener.push(['on', 'change', (newValue, previousValue) => {
        throw new Error('test error');
      }]);
      window.ddListener.push(['on', 'change', (newValue, previousValue) => {
        done();
      }]);
      window.digitalData.test2 = 'test2';
    });

    it('should handle change callback exception', (done) => {
      window.ddListener.push(['on', 'change', (newValue, previousValue) => {
        throw new Error('test error');
      }]);
      window.digitalData.test2 = 'test2';
      setTimeout(done, 1000);
    });

    it('should NOT fire change callback', (done) => {
      window.ddListener.push(['on', 'change', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.test = 'test';
    });

    it('should NOT fire change key callback', (done) => {
      window.ddListener.push(['on', 'change:user.returning', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.user.returning = false;
    });

    it('should NOT fire change callback for array', (done) => {
      window.ddListener.push(['on', 'change:listing.items', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.listing.items.pop();
      window.digitalData.listing.items.push({id: 2});
    });

    it('should NOT fire length change callback for array', (done) => {
      window.ddListener.push(['on', 'change:listing.items.length', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.listing.items.pop();
      window.digitalData.listing.items.push({id: 3});
    });

    it('should NOT fire change callback if event was added', (done) => {
      window.ddListener.push(['on', 'change', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.events.push({
        name: 'Test Event'
      });
    });

  });


  describe(': listening for autoEvents based on DDL changes', () => {

    beforeEach(() => {
      window.digitalData = {
        page: {
          type: 'home'
        }
      };
      window.ddListener = [];
      _eventManager = new EventManager(window.digitalData, window.ddListener);
      _eventManager.setAutoEvents(new AutoEvents());
      _eventManager.initialize();
    });

    it('should fire Viewed Page event', (done) => {
      window.digitalData.page = {
        type: 'content'
      };
      setTimeout(() => {
        assert.ok(window.digitalData.events.length === 2);
        assert.ok(window.digitalData.events[1].name === 'Viewed Page');
        assert.ok(window.digitalData.events[1].page.type === 'content');
        done();
      }, 101)
    });

    it('should fire Viewed Page and Viewed Product Category events', (done) => {
      window.digitalData.page = {
        type: 'category'
      };
      setTimeout(() => {
        assert.ok(window.digitalData.events.length === 3);
        assert.ok(window.digitalData.events[1].name === 'Viewed Page');
        assert.ok(window.digitalData.events[1].page.type === 'category');
        assert.ok(window.digitalData.events[2].name === 'Viewed Product Category');
        assert.ok(window.digitalData.events[2].page.type === 'category');
        done();
      }, 101);
    });

    it('should fire Viewed Product Detail event', (done) => {
      window.digitalData.product = {
        id: '123',
        name: 'Test Product'
      };
      setTimeout(() => {
        assert.ok(window.digitalData.events.length === 2);
        assert.ok(window.digitalData.events[1].name === 'Viewed Product Detail');
        assert.ok(window.digitalData.events[1].product.id === '123');
        done();
      }, 101);
    });

    it('should fire Completed Transaction event', (done) => {
      window.digitalData.transaction = {
        orderId: '123',
      };
      setTimeout(() => {
        assert.ok(window.digitalData.events.length === 2);
        assert.ok(window.digitalData.events[1].name === 'Completed Transaction');
        assert.ok(window.digitalData.events[1].transaction.orderId === '123');
        done();
      }, 101);
    });
  });

});