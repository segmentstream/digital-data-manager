import assert from 'assert';
import Storage from './../src/Storage.js';
import DDStorage from './../src/DDStorage.js';

describe('DDStorage', () => {

  let _digitalData;
  let _storage = new Storage();
  let _ddStorage;

  describe('#persist', () => {

    beforeEach(() => {
      _digitalData = {
        user: {
          isSubscribed: true,
          email: 'test@email.com',
          temp: 'test'
        }
      };
      _ddStorage = new DDStorage(_digitalData,  _storage);
    });

    afterEach(() => {
      window.localStorage.clear();
      _ddStorage.clear();
      _ddStorage = undefined;
    });

    // it('should persist fields with and without exp dates', (done) => {
    //   _ddStorage.persist('user.isSubscribed');
    //   _ddStorage.persist('user.email', 100);
    //   _ddStorage.persist('user.temp', 0.001);
    //
    //   assert.deepEqual(_ddStorage.getPersistedKeys(), [
    //     'user.isSubscribed',
    //     'user.email',
    //     'user.temp'
    //   ]);
    //   assert.ok(_ddStorage.get('user.isSubscribed'), 'user.isSubscribed not defined');
    //   assert.ok(_ddStorage.get('user.email'), 'user.email not defined');
    //   assert.ok(_ddStorage.get('user.temp'), 'user.temp not defined');
    //
    //   setTimeout(() => {
    //     assert.ok(_ddStorage.get('user.isSubscribed'), 'user.isSubscribed not defined');
    //     assert.ok(_ddStorage.get('user.email'), 'user.email not defined');
    //     assert.ok(!_ddStorage.get('user.temp'), 'user.temp should be empty');
    //     assert.deepEqual(_ddStorage.getPersistedKeys(), [
    //       'user.isSubscribed',
    //       'user.email'
    //     ]);
    //     done();
    //   }, 10);
    // });

  });

});
