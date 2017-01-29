import assert from 'assert';
import reset from './../reset.js';
import Driveback from './../../src/integrations/Driveback.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Driveback', () => {
  let driveback;
  const options = {
    websiteToken: 'aba543e1-1413-5f77-a8c7-aaf6979208a3'
  };

  beforeEach(() => {
    driveback = new Driveback(window.digitalData, options);
    ddManager.addIntegration('Driveback', driveback);
  });

  afterEach(() => {
    driveback.reset();
    ddManager.reset();
    reset();
  });

  describe('#constructor', () => {

    it('should create Driveback integrations with proper options and tags', () => {
      assert.equal(options.websiteToken, driveback.getOption('websiteToken'));
      assert.equal('script', driveback.getTag().type);
      assert.ok(driveback.getTag().attr.src.indexOf('driveback.ru') > 0);
    });

  });

  describe('#load', () => {

    it('should load', (done) => {
      assert.ok(!driveback.isLoaded());
      ddManager.once('load', () => {
        assert.ok(driveback.isLoaded());
        done();
      });
      ddManager.initialize();
    });

    it('should not load if Driveback is already loaded', (done) => {
      const originalIsLoaded = driveback.isLoaded;
      driveback.isLoaded = () => {
        return true;
      };
      assert.ok(driveback.isLoaded());
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
      ddManager.initialize();
    });

    it('should initialize all global variables', () => {
      assert.ok(window.DrivebackNamespace);
      assert.ok(window.DriveBack);
      assert.ok(window.Driveback);
      assert.ok(Array.isArray(DrivebackOnLoad));
      assert.ok(typeof window.DrivebackLoaderAsyncInit === 'function');
    });

    it('should not add dbex snippet by default', () => {
      assert.ok(!window.dbex);
    });
  });

  describe('after loading with experiments', () => {
    beforeEach((done) => {
      driveback.setOption('experiments', true);
      driveback.setOption('experimentsToken', '123123');
      ddManager.once('load', done);
      ddManager.initialize();
    });

    it('should add dbex snippet if specified in options', () => {
      assert.ok(window.dbex);
    });

    it('should initialize dbex and fire callback function', (done) => {
      window.dbex(function() {
        assert.ok(true);
        done();
      });
    });
  });

});
