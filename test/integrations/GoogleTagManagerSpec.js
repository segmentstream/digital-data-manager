import assert from 'assert';
import reset from './../reset.js';
import GoogleTagManager from './../../src/integrations/GoogleTagManager.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: GoogleTagManager', () => {
  let gtm;
  const options = {
    containerId: 'GTM-M9CMLZ'
  };

  beforeEach(() => {
    gtm = new GoogleTagManager(window.digitalData, options);
    ddManager.addIntegration(gtm);
  });

  afterEach(() => {
    gtm.reset();
    ddManager.reset();
    reset();
  });

  describe('#constructor', () => {

    it('should create GTM integrations with proper options and tags', () => {
      assert.equal(options.containerId, gtm.getOption('containerId'));
      assert.equal('script', gtm.getTag().type);
      assert.ok(gtm.getTag().attr.src.indexOf(options.containerId) > 0);
    });

  });

  describe('#load', () => {

    it('should load', (done) => {
      assert.ok(!gtm.isLoaded(), 'Expected `gtm.isLoaded()` to be false before loading.');
      ddManager.once('ready', () => {
        assert.ok(gtm.isLoaded(), 'Expected `gtm.isLoaded()` to be true after loading.');
        done();
      });
      ddManager.initialize();
    });

  });

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done);
      ddManager.initialize();
    });

    it('should update dataLayer', () => {
      let dl = window.dataLayer;

      assert.ok(dl);
      assert.ok(dl[0].event === 'gtm.js');
      assert.ok(typeof dl[0]['gtm.start'] === 'number');
    });

    describe('#track', () => {

      beforeEach(() => {
        window.dataLayer = [];
      });

      it('should send event', () => {
        window.digitalData.events.push({
          name: 'some-event',
          category: 'some-category'
        });

        let dl = window.dataLayer;

        assert.ok(dl[0].event === 'some-event');
        assert.ok(dl[0].eventCategory === 'some-category');
      });

      it('should send event with additional parameters', () => {
        window.digitalData.events.push({
          name: 'some-event',
          category: 'some-category',
          additionalParam: true
        });

        let dl = window.dataLayer;

        assert.ok(dl[0].event === 'some-event');
        assert.ok(dl[0].additionalParam === true);
      });

    });
  });

});