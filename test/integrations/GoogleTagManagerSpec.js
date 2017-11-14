import assert from 'assert';
import reset from './../reset.js';
import sinon from 'sinon';
import GoogleTagManager from './../../src/integrations/GoogleTagManager.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: GoogleTagManager', () => {
  describe('using containerID', () => {

    let gtm;
    const options = {
      containerId: 'GTM-M9CMLZ',
    };

    beforeEach(() => {
      gtm = new GoogleTagManager(window.digitalData, options);
      ddManager.addIntegration('Google Tag Manager', gtm);
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
        assert.ok(!gtm.isLoaded());
        gtm.once('load', () => {
          assert.ok(gtm.isLoaded());
          done();
        });
        ddManager.initialize();
      });
    });

    describe('after loading', () => {
      beforeEach((done) => {
        gtm.once('load', done);
        ddManager.initialize();
      });

      it('should update dataLayer', (done) => {
        let dl = window.dataLayer;
        assert.ok(dl);
        setTimeout(() => {
          assert.ok(dl.find((dlItem) => {
            return dlItem.event === 'gtm.js';
          }));
          assert.ok(dl.find((dlItem) => {
            return dlItem.event === 'DDManager Ready';
          }));
          // assert.ok(dl.find((dlItem) => {
          //   return dlItem.event === 'DDManager Loaded';
          // }));
          assert.ok(dl.find((dlItem) => {
            return dlItem.event === 'gtm.dom';
          }));
          assert.ok(dl.find((dlItem) => {
            return dlItem.event === 'gtm.load';
          }));
          done();
        }, 10);
      });

      describe('#trackEvent', () => {

        beforeEach(() => {
          window.dataLayer = [];
          sinon.stub(window.dataLayer, 'push');
        });

        afterEach(() => {
          window.dataLayer.push.restore();
        });

        it('should send event', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            callback: () => {
              let dl = window.dataLayer;
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                eventCategory: 'some-category',
              }));
              done();
            }
          });
        });

        it('should send event with additional parameters', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true,
            callback: () => {
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                additionalParam: true,
              }));
              done();
            }
          });
        });
      });
    });

  });

  describe('using existing GTM', () => {

    let gtm;

    beforeEach(() => {
      window.dataLayer = [];
      // window.dataLayer.push = function() {
      //   window.dataLayer.prototype.apply(this,arguments);
      // };
      gtm = new GoogleTagManager(window.digitalData, {
        noConflict: true,
      });
      ddManager.addIntegration('Google Tag Manager', gtm);
    });

    afterEach(() => {
      gtm.reset();
      ddManager.reset();
      reset();
    });

    describe('after loading', () => {
      beforeEach((done) => {
        ddManager.once('ready', done);
        ddManager.initialize();
        sinon.stub(window.dataLayer, 'push');
      });

      afterEach(() => {
        window.dataLayer.push.restore();
      });

      describe('#trackEvent', () => {

        it('should send event with additional parameters to existing GTM', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true,
            callback: () => {
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                additionalParam: true
              }));
              done();
            }
          });
        });

      });
    });
  });

});
