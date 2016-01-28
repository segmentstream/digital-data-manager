import assert from 'assert';
import sinon from 'sinon';
import deleteProperty from './../src/functions/deleteProperty.js';
import Storage from './../src/Storage.js';
import DigitalDataEnricher from './../src/DigitalDataEnricher.js';

describe('DigitalDataEnricher', () => {

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
    _digitalDataEnricher = new DigitalDataEnricher(_digitalData, new Storage());
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

  afterEach(() => {
    _digitalDataEnricher.getStorage().clear();
  });

  after(() => {
    _htmlGlobals.getLocation.restore();
    _htmlGlobals.getDocument.restore();
    _htmlGlobals.getNavigator.restore();
  });

  describe('#enrichPageData', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
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
          url: 'http://example.com/home'
        },
        context: {},
        events: []
      };
    });

    it('should enrich DDL context variable', () => {
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichContextData();
      assert.ok(_digitalData.context.userAgent === _navigator.userAgent);
    });

  });


  describe('#enrichUserData', () => {

    before(() => {
      _digitalData = {
        user: {},
        page: {
          type: 'home',
        },
        context: {},
        events: []
      };
    });

    it('should enrich DDL context variable', () => {
      _digitalDataEnricher.setDigitalData(_digitalData);
      _digitalDataEnricher.enrichUserData();

      const anonymousId = _digitalData.user.anonymousId;
      assert.ok(anonymousId);

      _digitalDataEnricher.enrichUserData();
      assert.ok(anonymousId === _digitalData.user.anonymousId);
    });

  });

});
