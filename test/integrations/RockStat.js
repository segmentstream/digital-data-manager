import assert from 'assert';
import reset from './../reset.js';
import RockStat from './../../src/integrations/RockStat.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: RockStat', () => {
  describe('using projectID', () => {

    let rst;
    const options = {
      projectId: 'f0f53343-e7fb-4657-aa8c-abddbe7b54b4'
    };

    beforeEach(() => {
      rst = new RockStat(window.digitalData, options);
      ddManager.addIntegration('RockStat', rst);
    });

    afterEach(() => {
      rst.reset();
      ddManager.reset();
      reset();
    });

    describe('#constructor', () => {

      it('should create RockStat integrations with proper options and tags', () => {
        assert.equal(options.projectId, rst.getOption('projectId'));
        assert.equal('script', rst.getTag().type);
        assert.ok(rst.getTag().attr.src.indexOf(options.projectId) > 0);
      });

    });

    describe('#load', () => {

      it('should load', (done) => {
        assert.ok(!rst.isLoaded());
        ddManager.once('load', () => {
          assert.ok(rst.isLoaded());
          done();
        });
        ddManager.initialize();
      });

      it('should not load if rst is already loaded', (done) => {
        const originalIsLoaded = rst.isLoaded;
        rst.isLoaded = () => {
          return true;
        };
        assert.ok(rst.isLoaded());
        ddManager.once('ready', () => {
          assert.ok(!originalIsLoaded());
          done();
        });
        ddManager.initialize();
      });

    });

    describe('after loading', () => {
      beforeEach((done) => {
        ddManager.once('load', done);
        ddManager.initialize({
          autoEvents: false
        });
      });

      it('should update dataLayer', (done) => {
        let dl = window.dataLayer;
        assert.ok(dl);
        setTimeout(() => {
          assert.ok(dl[0].event === 'rst.js');
          assert.ok(typeof dl[0]['rst.start'] === 'number');
          assert.ok(dl[1].event === 'DDManager Ready');
          assert.ok(dl[2].event === 'rst.dom');
          assert.ok(dl[3].event === 'rst.load');
          assert.ok(dl[4].event === 'DDManager Loaded');
          done();
        }, 10);
      });

      describe('#trackEvent', () => {

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
});
