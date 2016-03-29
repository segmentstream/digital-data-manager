import SegmentStream from './../../src/integrations/SegmentStream.js'
import ddManager from './../../src/ddManager.js';
import sinon from 'sinon';
import assert from 'assert';
import reset from './../reset.js';

describe('SegmentStream', function() {

  let _ss;
  let options = {
    sessionLength: 60
  };

  beforeEach(() => {
    window.digitalData = {
      events: []
    };
    _ss = new SegmentStream(window.digitalData, options);
    ddManager.addIntegration(_ss);
  });

  afterEach(() => {
    _ss.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', function () {
    beforeEach(function () {
      sinon.stub(_ss, 'load');
    });

    afterEach(function () {
      _ss.load.restore();
    });

    describe('#initialize', function () {

      it('it should initialize all stub functions`', function () {
        ddManager.initialize();

        assert.ok(window.ssApi.initialize);
        assert.ok(window.ssApi.getData);
        assert.ok(window.ssApi.getAnonymousId);
        assert.ok(window.ssApi.track);
        assert.ok(window.ssApi.pushOnReady);
        assert.equal(window.ssApi.length, 2);
        assert.equal(window.ssApi[0][0], 'initialize');
        assert.equal(window.ssApi[1][0], 'pushOnReady');
      });

    });

  });

  describe('after loading', function () {
    beforeEach((done) => {
      window.digitalData.user = {
        test: 'test',
        lifetimeVisitCount: 5,
      };
      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false
      });
    });

    describe('#enrichDigitalData', function () {

      it('should enrich digitalData.user', () => {
        assert.equal(window.digitalData.user.test, 'test');
        assert.equal(window.digitalData.user.lifetimeVisitCount, 5);
        assert.equal(window.digitalData.user.ssAttributes.lifetimeVisitCount, 0);
        assert.ok(window.digitalData.user.ssAttributes.firstVisit !== undefined);
        assert.ok(window.digitalData.user.anonymousId);
      });

      it('should track Viewed Page semantic event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: () => {
            assert.equal(window.digitalData.user.ssAttributes.lifetimeVisitCount, 1);
            assert.ok(new Date(window.digitalData.user.ssAttributes.firstVisit) > new Date(Date.now() - 10000));
            done();
          }
        });
      });

      it('should track Viewed Product Detail semantic event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 100
          },
          callback: () => {
            assert.equal(window.digitalData.user.ssAttributes.viewedProductsCount, 1);
            assert.equal(window.digitalData.user.ssAttributes.lifetimeViewedProductsCount, 1);
            assert.equal(window.digitalData.user.ssAttributes.lifetimeAverageViewedProductsPrice, 100);
            assert.equal(window.digitalData.user.ssAttributes.averageViewedProductsPrice, 100);
            assert.ok(new Date(window.digitalData.user.ssAttributes.firstVisit) > new Date(Date.now() - 10000));
            done();
          }
        });
      });

      it('should track Added Product semantic event', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 100
          },
          callback: () => {
            assert.equal(window.digitalData.user.ssAttributes.everAddedToCart, true);
            assert.equal(window.digitalData.user.ssAttributes.addedToCart, true);
            done();
          }
        });
      });

    });
  });
});