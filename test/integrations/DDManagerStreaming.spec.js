import assert from 'assert';
import sinon from 'sinon';
import { setIgnoreSameDomainCheck } from 'driveback-utils/utmParamsFromReferrer';
import htmlGlobals from 'driveback-utils/htmlGlobals';
import reset from '../reset';
import DDManagerStreaming from '../../src/integrations/DDManagerStreaming';
import ddManager from '../../src/ddManager';


describe('Integrations: DDManagerStreaming', () => {
  let ddManagerStreaming;
  const options = {};

  const _location = {
    protocol: 'https:',
    hostname: 'example.com',
    port: '',
    pathname: '/home',
    href: 'https://example.com/home',
    search: '',
    hash: '#title1',
  };

  before(() => {
    setIgnoreSameDomainCheck(true);
  });

  after(() => {
    setIgnoreSameDomainCheck(false);
  });

  beforeEach(() => {
    window.digitalData = {
      context: {},
    };
    ddManagerStreaming = new DDManagerStreaming(window.digitalData, options);
    ddManager.addIntegration('DDManager Streaming', ddManagerStreaming);
  });

  afterEach(() => {
    ddManagerStreaming.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(ddManagerStreaming, 'load');
    });

    afterEach(() => {
      ddManagerStreaming.load.restore();
    });

    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize();
        assert.ok(ddManagerStreaming.isLoaded());
      });

      it('should not load any tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(!ddManagerStreaming.load.calledOnce);
      });
    });
  });


  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(ddManagerStreaming, 'load');
      ddManager.once('ready', () => {
        done();
      });
      ddManager.initialize();
    });

    afterEach(() => {
      htmlGlobals.getLocation.restore();
      htmlGlobals.getDocument.restore();
    });

    it('#visit from Search Engine', () => {
      const _document = {
        referrer: 'https://www.google.com/search?ei=5m92XOv5KYyxkwWe66WABQ&q=segmentstream&oq=segmentstream',
      };
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'google',
        medium: 'organic',
        term: 'segmentstream',
      });
    });

    it('#visit from other site', () => {
      const _document = {
        referrer: 'http://www.samesite.com',
      };
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'samesite.com',
        medium: 'referral',
      });
    });

    it('#visit with ymclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com',
      };
      _location.href = 'https://example.com/home?ymclid=1';
      _location.search = '?ymclid=1';
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'yandex_market',
        medium: 'cpc',
      });
    });

    it('#visit with yclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com',
      };
      _location.href = 'https://example.com/home?yclid=1';
      _location.search = '?yclid=1';
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'yandex',
        medium: 'cpc',
      });
    });

    it('#visit with gclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com',
      };
      _location.href = 'https://example.com/home?gclid=1';
      _location.search = '?gclid=1';
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'google',
        medium: 'cpc',
      });
    });

    it('#do not override utm-params', () => {
      const _document = {
        referrer: 'https://www.google.com/search?ei=5m92XOv5KYyxkwWe66WABQ&q=segmentstream&oq=segmentstream',
      };
      _location.href = 'https://example.com/home?utm_source=test&utm_medium=test';
      _location.search = '?utm_source=test&utm_medium=test';
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'test',
        medium: 'test',
      });
    });

    it('#internal visits', () => {
      const _document = {
        referrer: 'https://example.com/home?utm_source=test&utm_medium=test',
      };
      _location.href = 'https://example.com/next';
      _location.search = '';
      setIgnoreSameDomainCheck(false);
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
      assert.ok(!ddManagerStreaming.normalize({}).context.campaign);
    });
  });
});
