import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Mindbox from './../../src/integrations/Mindbox';
import ddManager from './../../src/ddManager';
import noop from './../../src/functions/noop';

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
      it('should preapre stubs', () => {
        ddManager.initialize();
        assert.ok(typeof window.directCrm === 'function');
        assert.ok(window.directCrm.Queue);
      });

      it('should create tracker', () => {
        window.directCrm = noop;
        sinon.stub(window, 'directCrm');
        ddManager.initialize();
        assert.ok(window.directCrm.calledWith('create', {
          projectSystemName: mindbox.getOption('projectSystemName'),
          brandSystemName: mindbox.getOption('brandSystemName'),
          pointOfContactSystemName: mindbox.getOption('pointOfContactSystemName'),
          projectDomain: mindbox.getOption('projectDomain'),
          serviceDomain: 'tracker.directcrm.ru',
        }));
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done);
      ddManager.initialize();
    });

    afterEach(() => {

    });

    describe('#onViewedProductDetail', () => {
      const productId = '123';
      mindbox.setOption('operationMapping', {
        'Viewed Product Detail':
      })

      it.only('should track viewed product operation', () => {
        assert.ok(window.directCrm.calledWith('performOperation', {
          operation,
          data: {
            action: { productId },
          },
        });
      });
    });
  });
});
