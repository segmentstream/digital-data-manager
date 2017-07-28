import assert from 'assert';
import ddManager from './../../src/ddManager';

describe('CustomScripts', () => {

  beforeEach(() => {
    window.digitalData = {
      page: {
        categoryId: 1
      },
      type: 'product',
      events: []
    };
  });

  afterEach(() => {
    ddManager.reset();
  });

  it('should run custom scripts on init', (done) => {
    ddManager.initialize({
      scripts: [
        {
          name: 'Test 1',
          handler: function() {
            this.queryParam('test');
            this.digitalData('user.test');
            this.cookie('test');
            this.global('test.test2');
            this.dataLayer('test.test');
            this.domQuery('.class');
            done();
          }
        }
      ]
    });
  });

  it('should not run custom scripts on init', (done) => {
    ddManager.initialize({
      scripts: [
        {
          name: 'Test 1',
          event: 'Test Event',
          handler: function(event) {
            this.queryParam('test');
            this.get(event, 'name');
            this.digitalData('user.test');
            this.cookie('test');
            this.global('test.test2');
            this.dataLayer('test.test');
            this.domQuery('.class');
            assert.ok(false);
          }
        }
      ]
    });
    setTimeout(() => {
      done();
    }, 1000)
  });

  it('should run custom scripts on event', (done) => {
    ddManager.initialize({
      scripts: [
        {
          name: 'Test 1',
          event: 'Test Event',
          handler: function(event) {
            this.queryParam('test');
            this.get(event, 'name');
            this.digitalData('user.test');
            this.cookie('test');
            this.global('test.test2');
            this.dataLayer('test.test');
            this.domQuery('.class');
            done();
          }
        }
      ]
    });
    digitalData.events.push({
      name: 'Test Event'
    });
  });
});
