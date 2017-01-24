import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Mindbox from './../../src/integrations/Mindbox.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Mindbox', () => {
  let mindbox;
  const options = {
    serviceDomain: 'Test',
    projectSystemName: 'Test',
    brandSystemName: 'drivebackru',
    pointOfContactSystemName: 'test-services.directcrm.ru',
    projectDomain: 'tracker.directcrm.ru',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: [],
    };
    mindbox = new Mindbox(window.digitalData, options);
    ddManager.addIntegration('Mindbox', mindbox);
  });

  afterEach(() => {
    mindbox.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.equal(options.serviceDomain, mindbox.getOption('serviceDomain'));
        assert.equal(options.projectSystemName, mindbox.getOption('projectSystemName'));
        assert.equal(options.brandSystemName, mindbox.getOption('brandSystemName'));
        assert.equal(options.pointOfContactSystemName, mindbox.getOption('pointOfContactSystemName'));
        assert.equal(options.projectDomain, mindbox.getOption('projectDomain'));
      });
    });

    describe('#initialize', () => {
      it('should call ready after initialization', () => {
        sinon.stub(mindbox, 'onLoad');
        ddManager.initialize();
        assert.ok(mindbox.onLoad.calledOnce);
        mindbox.onLoad.restore();
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      // sinon.spy(mindbox, 'loadTrackingScript');
      // sinon.spy(mindbox, 'clearTrackingObjects');
      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false,
      });
    });

    afterEach(() => {
      // mindbox.loadTrackingScript.restore();
      // mindbox.clearTrackingObjects.restore();
    });
  });
});
