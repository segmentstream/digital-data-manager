import assert from 'assert';
import DDHelper from './../src/DDHelper.js';

describe('DDHelper', () => {

  let _digitalData;

  describe('#get', () => {
    before(() => {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        listing: {
          items: [
            {
              id: '1'
            },
            {
              id: '2'
            }
          ]
        }
      };
    });

    it('should get nested object', () => {
      assert.ok(DDHelper.get('page.type', _digitalData) === 'category');
    });

    it('should get nested object using array notation', () => {
      assert.ok(DDHelper.get('listing.items[1].id', _digitalData) === '2');
    });

    it('should get nested object using object notation', () => {
      assert.ok(DDHelper.get('listing.items.1.id', _digitalData) === '2');
    });

    it('should get nested object property', () => {
      assert.ok(DDHelper.get('listing.items.length', _digitalData) === 2);
    });

  });

});