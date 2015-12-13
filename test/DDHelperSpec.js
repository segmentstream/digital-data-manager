import assert from 'assert';
import DDHelper from './../src/DDHelper.js';

describe('DDHelper', () => {

  let _ddHelper;

  describe('#get', () => {
    before(() => {
      _ddHelper = new DDHelper({
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
      })
    });

    it('should get nested object', () => {
      assert.ok(_ddHelper.get('page.type') === 'category');
    });

    it('should get nested object using array notation', () => {
      assert.ok(_ddHelper.get('listing.items[1].id') === '2');
    });

    it('should get nested object using object notation', () => {
      assert.ok(_ddHelper.get('listing.items.1.id') === '2');
    });

    it('should get nested object property', () => {
      assert.ok(_ddHelper.get('listing.items.length') === 2);
    });

  });

});