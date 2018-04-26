import assert from 'assert';
import sinon from 'sinon';
import deleteProperty from 'driveback-utils/deleteProperty.js';
import DigitalDataEnricher from './../src/enrichments/DigitalDataEnricher.js';
import Storage from './../src/Storage.js';
import DDStorage from './../src/DDStorage.js';
import ddManager from './../src/ddManager';

describe('DigitalDataEnricher', () => {

  let _ddListener = [];
  let _ddStorage;
  let _digitalData;
  let _htmlGlobals;
  let _digitalDataEnricher;
  let _document = {
    referrer: 'http://google.com',
    title: 'Website Home Page'
  };
  let _location = {
    pathname: '/home',
    href: 'Website Home Page',
    search: '?utm_source=newsletter&utm_medium=email&utm_campaign=test_campaign',
    hash: '#title1'
  };
  let _navigator = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  };

  before(() => {
    _ddListener = [];
    _digitalDataEnricher = new DigitalDataEnricher(_digitalData, _ddListener);
    _htmlGlobals = _digitalDataEnricher.getHtmlGlobals();
    sinon.stub(_htmlGlobals, 'getDocument', () => {
      return _document;
    });
    sinon.stub(_htmlGlobals, 'getLocation', () => {
      return _location;
    });
    sinon.stub(_htmlGlobals, 'getNavigator', () => {
      return _navigator;
    });
  });

  after(() => {
    _htmlGlobals.getLocation.restore();
    _htmlGlobals.getDocument.restore();
    _htmlGlobals.getNavigator.restore();
    if (_ddStorage) {
      _ddStorage.clear();
      _ddStorage = undefined;
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('#enrichPageData', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home',
        },
        events: [],
      };
    });

    it('should enrich DDL page variable', () => {
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichPageData();
      assert.ok(_digitalData.page.url === _location.href);
      assert.ok(_digitalData.page.path === _location.pathname);
      assert.ok(_digitalData.page.queryString === _location.search);
      assert.ok(_digitalData.page.hash === _location.hash);
      assert.ok(_digitalData.page.referrer === _document.referrer);
      assert.ok(_digitalData.page.title === _document.title);
    });
  });

  describe('#enrichContextData', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home',
          url: 'http://example.com/home',
        },
        context: {},
        events: [],
      };
    });

    it('should enrich DDL context userAgent variable', () => {
      _ddStorage = new DDStorage(_digitalData, new Storage());
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.setDDStorage(_ddStorage);
      _digitalDataEnricher.enrichContextData();
      assert.ok(_digitalData.context.userAgent === _navigator.userAgent);
    });

    it('should enrich DDL context campaign variable', () => {
      _ddStorage = new DDStorage(_digitalData, new Storage());
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.setDDStorage(_ddStorage);
      _digitalDataEnricher.enrichContextData();
      assert.deepEqual(_digitalData.context.campaign, {
        name: 'test_campaign',
        source: 'newsletter',
        medium: 'email'
      });
    });

  });

  describe('#enrichLegacyVersions', () => {

    it('should enrich DDL listing variable with categoryId', () => {
      _digitalData = {
        page: {
          type: 'category',
          categoryId: '123'
        },
        events: [],
        version: '1.0.0'
      };
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichLegacyVersions();
      assert.ok(_digitalData.listing.categoryId === '123');
    });

    it('should enrich DDL listing variable with listId', () => {
      _digitalData = {
        page: {
          type: 'category',
          categoryId: '123'
        },
        listing: {
          listName: 'main'
        },
        recommendation: {
          listName: 'recommendation'
        },
        events: [],
        version: '1.1.0'
      };
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichLegacyVersions();
      assert.ok(_digitalData.listing.listId === 'main');
      assert.ok(_digitalData.recommendation.listId === 'recommendation');
    });

    it('should enrich DDL recommendation array with listId', () => {
      _digitalData = {
        page: {
          type: 'category',
          categoryId: '123'
        },
        listing: {
          listName: 'main'
        },
        recommendation: [
          {
            listName: 'recom1'
          },
          {
            listName: 'recom2'
          }
        ],
        events: [],
        version: '1.0.0'
      };
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichLegacyVersions();
      assert.ok(_digitalData.listing.listId === 'main');
      assert.ok(_digitalData.recommendation[0].listId === 'recom1');
      assert.ok(_digitalData.recommendation[1].listId === 'recom2');
    });
  });

  describe('#enrichDDStorageData', () => {
    it('should enrich data from local storage', () => {
      _digitalData = {
        user: {
          userId: '123',
          hasCoffeeMachine: true,
          hasFerrari: true,
          isSubscribed: true,
          visitedContactPageTimes: 20,
          segments: ['segment1', 'segment2'],
        },
        listing: {
          listId: 'test',
        },
      };
      _ddStorage = new DDStorage(_digitalData, new Storage());
      _ddStorage.clear(); // just to be sure
      _ddStorage.persist('user.hasCoffeeMachine');
      _ddStorage.persist('user.hasFerrari');
      _ddStorage.persist('user.visitedContactPageTimes');
      _ddStorage.persist('user.segments');
      _ddStorage.persist('user.isSubscribed');
      _ddStorage.persist('listing.listId');

      _digitalData = {
        user: {
          userId: '123',
          isSubscribed: false,
          hasFerrari: false
        }
      };
      _digitalDataEnricher.setDigitalData(_digitalData);
      _ddStorage = new DDStorage(_digitalData, new Storage());
      _digitalDataEnricher.setDDStorage(_ddStorage);
      _digitalDataEnricher.enrichDigitalData();

      assert.ok(_digitalData.user.anonymousId);
      assert.deepEqual(_digitalData.user, {
        userId: '123',
        isSubscribed: false, // will not be eniched, because explicit value is set from server
        hasCoffeeMachine: true,
        hasFerrari: false,
        anonymousId: _digitalData.user.anonymousId,
        visitedContactPageTimes: 20,
        segments: ['segment1', 'segment2'],
        isReturning: false,
      });

      assert.ok(_ddStorage.get('user.hasCoffeeMachine'));
      assert.ok(_ddStorage.get('user.isSubscribed'));
      assert.ok(_ddStorage.get('user.hasFerrari') === true);
    })
  });


  describe('default enrichments', () => {

    function enirch(digitalData, clear = false) {
      _ddStorage = new DDStorage(digitalData, new Storage());
      if (clear) {
        _ddStorage.clear();
      }
      _digitalDataEnricher.setDigitalData(digitalData);
      _digitalDataEnricher.setDDStorage(_ddStorage);
      _digitalDataEnricher.enrichDigitalData();
    }

    it('should enrich user data', () => {
      _digitalData = {
        user: {
          isSubscribed: true,
          isLoggedIn: true,
          email: 'test@email.com',
          hasTransacted: true,
          lastTransactionDate: '2016-03-30T10:05:26.041Z'
        }
      };
      enirch(_digitalData);

      _digitalData = {
        user: {
          isLoggedIn: false,
        }
      };
      enirch(_digitalData);
      assert.ok(!_digitalData.user.isLoggedIn);
      assert.ok(_digitalData.user.everLoggedIn);
      assert.ok(_digitalData.user.hasTransacted);
      assert.ok(_digitalData.user.isSubscribed);
      assert.equal(_digitalData.user.email, 'test@email.com');
      assert.equal(_digitalData.user.lastTransactionDate, '2016-03-30T10:05:26.041Z');
    });

    it('should enrich context.campaign data', () => {
      _digitalData = {};
      enirch(_digitalData);
      assert.deepEqual(_digitalData.context.campaign, {
        name: 'test_campaign', source: 'newsletter', medium: 'email'
      });

      // overddie location
      _htmlGlobals.getLocation.restore();
      sinon.stub(_htmlGlobals, 'getLocation', () => {
        return {
          search: ''
        };
      });

      // reset dd
      deleteProperty(_digitalData.context, 'campaign');
      assert.ok(!_digitalData.context.campaign);

      // enirch again
      enirch(_digitalData);
      assert.deepEqual(_digitalData.context.campaign, {
        name: 'test_campaign', source: 'newsletter', medium: 'email'
      });
    });

    /*
    it('should update user.isReturning status', (done) => {
      _digitalData = {};
      _ddStorage = new DDStorage(_digitalData, new Storage());
      _ddStorage.clear(); // to prevent using previous lastEventTimestamp value
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.setDDStorage(_ddStorage);
      _digitalDataEnricher.setOption('sessionLength', 0.01);
      _digitalDataEnricher.enrichDigitalData();

      assert.ok(!_digitalData.user.isReturning, 'isReturning should be false');

      setTimeout(() => {
        _digitalDataEnricher.enrichDigitalData();
        assert.ok(_digitalData.user.isReturning, 'isReturning should be true');
        done();
      }, 200);
    });
    */

    // it('should fire Started Session event', (done) => {
    //   _digitalData = {};
    //   _ddStorage = new DDStorage(_digitalData, new Storage());
    //   _ddStorage.clear(); // to prevent using previous lastEventTimestamp value
    //   _digitalDataEnricher.setDigitalData(_digitalData);
    //   _digitalDataEnricher.setDDStorage(_ddStorage);
    //   _digitalDataEnricher.setOption('sessionLength', 0.1);
    //   _digitalDataEnricher.enrichDigitalData();
    //
    //   assert.equal(_digitalData.events[0].name, 'Session Started', 'should fire Session Started');
    //
    //   _digitalDataEnricher.enrichDigitalData();
    //
    //   assert.ok(!_digitalData.events[1]);
    //
    //   setTimeout(() => {
    //     _digitalDataEnricher.enrichDigitalData();
    //     setTimeout(() => {
    //       assert.equal(_digitalData.events[1].name, 'Session Started', 'should fire Session Started again');
    //       done();
    //     }, 202);
    //   }, 110);
    // });
  });

  describe('Updated Cart enrichments', () => {

    afterEach(() => {
      ddManager.reset();
    });

    it('should process Updated Cart event for digitalData > 1.1.3', () => {
      window.digitalData = {
        version: '1.1.3',
        cart: {
          lineItems: [
            { product: { id: '1' }, quantity: 1 },
            { product: { id: '3' }, quantity: 3 }, // item will be removed
            { product: { id: '4' }, quantity: 3 },
          ],
        },
        events: [],
      };

      ddManager.initialize();

      const eventsSpy = sinon.spy(window.digitalData.events, 'push');
      const changesSpy = sinon.spy(window.digitalData.changes, 'push');

      window.digitalData.events.push({
        name: 'Updated Cart',
        cart: {
          lineItems: [
            { product: { id: '1' }, quantity: 3 }, // +2 quantity
            { product: { id: '2' }, quantity: 1 }, // +1 new item
            { product: { id: '4' }, quantity: 1 }, // -2 quantity
          ],
        },
      });

      // +2 quantity
      assert.ok(eventsSpy.calledWith(sinon.match({
        name: 'Added Product',
        product: {
          id: '1',
        },
        quantity: 2,
      })));

      // +1 new item
      assert.ok(eventsSpy.calledWith(sinon.match({
        name: 'Added Product',
        product: {
          id: '2',
        },
        quantity: 1,
      })));

      // -3 items
      assert.ok(eventsSpy.calledWith(sinon.match({
        name: 'Removed Product',
        product: {
          id: '3',
        },
        quantity: 3,
      })));

      // -2 quantity
      assert.ok(eventsSpy.calledWith(sinon.match({
        name: 'Removed Product',
        product: {
          id: '4',
        },
        quantity: 2,
      })));

      // cart changed
      assert.ok(changesSpy.calledWith(sinon.match(['cart', {
        lineItems: [
          { product: { id: '1' }, quantity: 3 }, // +2 quantity
          { product: { id: '2' }, quantity: 1 }, // +1 new item
          { product: { id: '4' }, quantity: 1 }, // -2 quantity
        ],
      }, 'DDManager SDK'])));
    });
  });
});
