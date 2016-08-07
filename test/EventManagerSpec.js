import assert from 'assert';
import reset from './reset.js';
import EventManager from './../src/EventManager.js';
import AutoEvents from './../src/AutoEvents.js';

describe('EventManager', () => {

  let _eventManager;
  let _digitalData;
  let _ddListener;

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
      _digitalData = {
        events: []
      };
      _ddListener = [];
      _eventManager = new EventManager(_digitalData, _ddListener);
    });

    it('should add time and hasFired fields to event', () => {
      let event = Object.assign({}, eventTemplate);

      _eventManager.initialize();

      _digitalData.events.push(event);

      assert.ok(_digitalData.events.length == 1);
      assert.ok(_digitalData.events[0].time > 100000);
      assert.ok(_digitalData.events[0].hasFired);
    });

    it('should process callback for event', () => {
      let event = Object.assign({}, eventTemplate);
      let callbackFired = false;
      let receivedEvent;

      _eventManager.initialize();

      _ddListener.push(['on', 'event', (e) => {
        callbackFired = true;
        receivedEvent = e;
      }]);
      _digitalData.events.push(event);

      assert.ok(callbackFired);
      assert.equal(receivedEvent.action, event.action);
      assert.equal(receivedEvent.category, event.category);
    });


    it('should process early callback for event', () => {
      let event = Object.assign({}, eventTemplate);

      _ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        assert.equal(e.action, event.action);
        assert.equal(e.category, event.category);
      }]);

      _eventManager.initialize();

      _digitalData.events.push(event);
    });

    it('should process early callback for early event', () => {
      let event = Object.assign({}, eventTemplate);

      _ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        assert.equal(e.action, event.action);
        assert.equal(e.category, event.category);
      }]);
      _digitalData.events.push(event);

      _eventManager.initialize();
    });

    it('should fire event with callback inside when no listeners', (done) => {
      _eventManager.initialize();
      _digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: function(result) {
          done();
        }
      });
    });

    it('should fire event with callback inside after listeners completed', (done) => {
      _eventManager.initialize();

      _ddListener.push(['on', 'event', (e) => {
        return 'test result';
      }]);

      _digitalData.events.push({
        name: 'Test',
        category: 'Test',
        callback: (results) => {
          assert.ok(results[0] == 'test result');
          done();
        }
      });
    });

    it('should enrich product data from DDL', (done) => {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      _ddListener.push(['on', 'event', (e) => {
        assert(e.product.name === 'Test Product');
        done();
      }]);

      _digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should not enrich product data from DDL', (done) => {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };

      _eventManager.initialize();

      _ddListener.push(['on', 'event', (e) => {
        assert(!e.product.name);
        done();
      }]);

      _digitalData.events.push({
        name: 'Clicked Product',
        enrichEventData: false,
        category: 'Ecommerce',
        product: '123'
      });
    });

    it('should process past events event if listener was added later', (done) => {
      _eventManager.initialize();

      _digitalData.events.push({
        name: 'Clicked Product',
        category: 'Ecommerce',
        product: {
          id: '123',
          name: 'Test Product'
        }
      });

      _ddListener.push(['on', 'event', (e) => {
        assert.ok(true);
        done();
      }]);
    });

  });

  describe(': listening for digitalData changes', () => {

    beforeEach(() => {
      _digitalData = {
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
      _ddListener = [];
      _eventManager = new EventManager(_digitalData, _ddListener);
      _eventManager.initialize();
    });

    it('should fire change callback', (done) => {
      _ddListener.push(['on', 'change', () => {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should fire change key callback', (done) => {
      _ddListener.push(['on', 'change:user.returning', (newValue, previousValue) => {
        assert.ok(newValue === true);
        assert.ok(previousValue === false);
        done();
      }]);
      _digitalData.user.returning = true;
    });

    it('should fire change callback for array', (done) => {
      _ddListener.push(['on', 'change:listing.items', (newValue, previousValue) => {
        assert.ok(newValue.length === 3);
        assert.ok(previousValue.length === 2);
        done();
      }]);
      _digitalData.listing.items.push({id: 3});
    });

    it('should fire length change callback for array', (done) => {
      _ddListener.push(['on', 'change:listing.items.length', (newValue, previousValue) => {
        assert.ok(newValue === 3);
        assert.ok(previousValue === 2);
        done();
      }]);
      _digitalData.listing.items.push({id: 3});
    });

    it('should fire change callbacks asynchronously, ignoring possible exceptions', (done) => {
      _ddListener.push(['on', 'change', (newValue, previousValue) => {
        throw new Error('test error');
      }]);
      _ddListener.push(['on', 'change', (newValue, previousValue) => {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should handle change callback exception', (done) => {
      _ddListener.push(['on', 'change', (newValue, previousValue) => {
        throw new Error('test error');
      }]);
      _digitalData.test2 = 'test2';
      setTimeout(done, 1000);
    });

    it('should NOT fire change callback', (done) => {
      _ddListener.push(['on', 'change', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.test = 'test';
    });

    it('should NOT fire change key callback', (done) => {
      _ddListener.push(['on', 'change:user.returning', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.user.returning = false;
    });

    it('should NOT fire change callback for array', (done) => {
      _ddListener.push(['on', 'change:listing.items', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({id: 2});
    });

    it('should NOT fire length change callback for array', (done) => {
      _ddListener.push(['on', 'change:listing.items.length', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({id: 3});
    });

    it('should NOT fire change callback if event was added', (done) => {
      _ddListener.push(['on', 'change', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.events.push({
        name: 'Test Event'
      });
    });

  });

  describe(': listening for digitalData define events', () => {

    beforeEach(() => {
      _digitalData = {
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
      _ddListener = [];
      _eventManager = new EventManager(_digitalData, _ddListener);
      _eventManager.initialize();
    });

    it('should fire define callback', (done) => {
      _ddListener.push(['on', 'define', () => {
        done();
      }]);
    });

    it('should fire define key callback', (done) => {
      _ddListener.push(['on', 'define:user.test', (value) => {
        assert.ok(value === true);
        done();
      }]);
      _digitalData.user.test = true;
    });

    it('should fire define key callback', (done) => {
      _digitalData.user.test = true;
      let ddListener = _ddListener || [];
      ddListener.push(['on', 'define:user.test', (value) => {
        assert.ok(value === true);
        done();
      }]);
    });

    it('should fire define callback for array', (done) => {
      _ddListener.push(['on', 'define:listing.items', (value) => {
        assert.ok(value.length === 3);
        done();
      }]);
      _digitalData.listing.items.push({id: 3});
    });

    it('should fire length define callback for array', (done) => {
      _ddListener.push(['on', 'define:listing.items.length', (value) => {
        assert.ok(value === 3);
        done();
      }]);
      _digitalData.listing.items.push({id: 3});
    });

    it('should fire define callbacks asynchronously, ignoring possible exceptions', (done) => {
      _ddListener.push(['on', 'define', (value) => {
        throw new Error('test error');
      }]);
      _ddListener.push(['on', 'define', (value) => {
        done();
      }]);
      _digitalData.test2 = 'test2';
    });

    it('should handle define callback exception', (done) => {
      _ddListener.push(['on', 'define', (value) => {
        throw new Error('test error');
      }]);
      _digitalData.test2 = 'test2';
      setTimeout(done, 1000);
    });

    it('should fire define callback only once', (done) => {
      _ddListener.push(['on', 'define', () => {
        assert.ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.test = 'test';
    });

    it('should fire define key callback only once', (done) => {
      _ddListener.push(['on', 'define:user.returning', () => {
        assert.ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:user.returning', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.user.returning = false;
    });

    it('should fire define callback for array only once', (done) => {
      _ddListener.push(['on', 'define:listing.items', () => {
        assert.ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:listing.items', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({id: 2});
    });

    it('should fire length define callback for array only once', (done) => {
      _ddListener.push(['on', 'define:listing.items.length', () => {
        assert.ok(true);
        done();
      }]);
      _ddListener.push(['on', 'define:listing.items.length', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      _digitalData.listing.items.pop();
      _digitalData.listing.items.push({id: 3});
    });

    it('should fire define callback event if key was already defined', (done) => {
      _ddListener.push(['on', 'define:user.returning', () => {
        assert.ok(true);
        done();
      }]);
    });

  });


  describe(': listening for autoEvents based on DDL changes', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        }
      };
      _ddListener = [];
      _eventManager = new EventManager(_digitalData, _ddListener);
      _eventManager.setAutoEvents(new AutoEvents());
      _eventManager.initialize();
    });

    it('should fire Viewed Page event', (done) => {
      _digitalData.page = {
        type: 'content'
      };
      setTimeout(() => {
        assert.ok(_digitalData.events.length === 2);
        assert.ok(_digitalData.events[1].name === 'Viewed Page');
        assert.ok(_digitalData.events[1].page.type === 'content');
        done();
      }, 101)
    });

    it('should fire Viewed Page and Viewed Product Category events', (done) => {
      _digitalData.page = {
        type: 'category',
      };
      _digitalData.listing = {
        categoryId: '123',
      };
      setTimeout(() => {
        assert.ok(_digitalData.events.length === 3);
        assert.ok(_digitalData.events[1].name === 'Viewed Page');
        assert.ok(_digitalData.events[1].page.type === 'category');
        assert.ok(_digitalData.events[2].name === 'Viewed Product Category');
        assert.ok(_digitalData.events[2].listing.categoryId === '123');
        done();
      }, 101);
    });

    it('should fire Viewed Product Detail event', (done) => {
      _digitalData.product = {
        id: '123',
        name: 'Test Product'
      };
      setTimeout(() => {
        assert.ok(_digitalData.events.length === 2);
        assert.ok(_digitalData.events[1].name === 'Viewed Product Detail');
        assert.ok(_digitalData.events[1].product.id === '123');
        done();
      }, 101);
    });

    it('should fire Completed Transaction event', (done) => {
      _digitalData.transaction = {
        orderId: '123',
      };
      setTimeout(() => {
        assert.ok(_digitalData.events.length === 2);
        assert.ok(_digitalData.events[1].name === 'Completed Transaction');
        assert.ok(_digitalData.events[1].transaction.orderId === '123');
        done();
      }, 101);
    });
  });

});
