import assert from 'assert';
import { expect } from 'chai';
import Storage from '../src/Storage';
import DDStorage from '../src/DDStorage';


describe('DDStorage', () => {
  let _digitalData;
  const _storage = new Storage();
  let _ddStorage;


  describe('#persist', () => {
    beforeEach(() => {
      _digitalData = {
        user: {
          isSubscribed: true,
          email: 'test@email.com',
          temp: 'test',
        },
      };
      _ddStorage = new DDStorage(_digitalData, _storage);
    });

    afterEach(() => {
      window.localStorage.clear();
      _ddStorage.clear();
      _ddStorage = undefined;
    });

    it('should persist _lastEventTimestamp', () => {
      // arrange
      const expectedDate = Date.now();
      _ddStorage.setLastEventTimestamp(expectedDate);
      // act
      const actualTimestamp = _ddStorage.getLastEventTimestamp();

      // assert
      assert.equal(actualTimestamp, expectedDate);
    });

    it('should return null timestamp when getLastEvent for empty localStorage', () => {
      const actualTimestamp = _ddStorage.getLastEventTimestamp();
      assert.equal(actualTimestamp, null);
    });

    describe('Empty localStorage use cases', () => {
      const tempStorage = window.localStorage;
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: null,
        });
      });
      afterEach(() => {
        Object.defineProperty(window, 'localStorage', {
          value: tempStorage,
        });
      });

      it('when get lastEventTimestamp should not throw any error', () => {
        expect(_ddStorage.getLastEventTimestamp()).to.not.throw;
      });

      it('when get any key should does not throw any error', () => {
        expect(_ddStorage.get('anyKey')).to.not.throw;
      });

      it('when set lastEventTimestamp should not throw any error', () => {
        expect(_ddStorage.setLastEventTimestamp(Date.now())).to.not.throw;
      });
    });
  });
});
