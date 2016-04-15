import assert from 'assert';
import reset from './../reset.js';
import Driveback from './../../src/integrations/Driveback.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Custom', () => {
  let customIntegration;
  const options = {
    websiteToken: 'aba543e1-1413-5f77-a8c7-aaf6979208a3'
  };

  beforeEach(() => {
    window.digitalData = {
      user: {},
      version: '1.0.1'
    };
    customIntegration = new ddManager.Integration(window.digitalData, {
      option1: 'test'
    });
    customIntegration.enrichDigitalData = function(done) {
      window.digitalData.user.isSubscribed = true;
      done();
    };
    customIntegration.trackEvent = function(event) {
      window.digitalData.user.trackedEvent = event.name;
    };
    ddManager.addIntegration('Custom Mapper', customIntegration);
  });

  afterEach(() => {
    customIntegration.reset();
    ddManager.reset();
    reset();
  });

  describe('#constructor', () => {

    it('should create Custom Mapper integrations with proper options', () => {
      assert.equal(customIntegration.getOption('option1'), 'test');
    });

  });

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done);
      ddManager.initialize();
    });

    it('should enrich digital data', () => {
      assert.ok(window.digitalData.user.isSubscribed);
    });

    it('should track event', (done) => {
      window.digitalData.events.push({
        name: 'Test',
        callback: () => {
          assert.equal(window.digitalData.user.trackedEvent, 'Test');
          done();
        }
      });
    });
  });
});