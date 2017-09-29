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

  it('should run custom scripts on init in proper order', (done) => {
    let scriptOneFired = false;
    let scriptTwoFired = false;
    ddManager.initialize({
      scripts: [
        {
          event: 'Viewed Page',
          name: 'Two',
          handler: function() {
            scriptTwoFired = true;
            assert.ok(scriptOneFired);
            done();            
          },
          priority: 0,
        },
        {
          event: 'Viewed Page',
          name: 'One',
          handler: function() {
            scriptOneFired = true;
            assert.ok(!scriptTwoFired);
          },
          priority: 1,
        },
      ]
    });
  });

  it('should run custom scripts on init in proper order (legacy)', (done) => {
    let scriptOneFired = false;
    let scriptTwoFired = false;
    ddManager.initialize({
      scripts: [
        {
          event: 'Viewed Page',
          handler: function() {
            scriptTwoFired = true;
            assert.ok(scriptOneFired);
            done();            
          },
        },
        {
          name: 'One',
          handler: function() {
            scriptOneFired = true;
            assert.ok(!scriptTwoFired);
          },
        },
      ]
    });
  });

  it('should fire once', (done) => {
    let firedTimes = 0;
    ddManager.initialize({
      scripts: [
        {
          name: 'Test 1',
          event: 'Viewed Page',
          handler: function() {
            firedTimes += 1;
          },
          fireOnce: true,
        },
      ],
    });
    window.digitalData.events.push({ name: 'Viewed Page' });
    setTimeout(() => {
      assert.equal(firedTimes, 1);
      done();
    }, 10);
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
