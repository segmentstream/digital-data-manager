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
        },
      };
    });

    it('should get nested object', () => {
      assert.ok(DDHelper.get('page.type', _digitalData) === 'category');
    });

    it('should get nested object using object notation', () => {
      assert.ok(DDHelper.get('listing.items.1.id', _digitalData) === '2');
    });

    it('should get nested object property', () => {
      assert.ok(DDHelper.get('listing.items.length', _digitalData) === 2);
    });

  });

  describe('#getProduct', () => {
    before(() => {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        product: {
          id: '1'
        },
        listing: {
          items: [
            {
              id: '2'
            },
            {
              id: '3'
            },
            {
              id: '5'
            }
          ]
        },
        recommendation: {
          listId: 'recom',
          items: [
            {
              id: '4'
            },
            {
              id: '5'
            }
          ]
        },
        cart: {
          lineItems: [
            {
              product: {
                id: '6'
              },
              quantity: 2
            }
          ]
        }
      };
    });

    it('should get product from product key', () => {
      assert.ok(DDHelper.getProduct('1', _digitalData).id === '1');
    });

    it('should get product from listing key', () => {
      assert.ok(DDHelper.getProduct('2', _digitalData).id === '2');
    });

    it('should get product from recommendation key', () => {
      assert.ok(DDHelper.getProduct('4', _digitalData).id === '4');
    });

    it('should get product from list key without any listId properties', () => {
      assert.ok(DDHelper.getProduct('5', _digitalData, 'recom').id === '5');
      assert.ok(!DDHelper.getProduct('5', _digitalData, 'recom').listId);
    });

    it('should get product from cart key', () => {
      assert.ok(DDHelper.getProduct('6', _digitalData).id === '6');
    });
  });

  describe('#getListItem', () => {
    before(() => {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        product: {
          id: '1'
        },
        listing: {
          items: [
            {
              id: '2'
            },
            {
              id: '3'
            },
            {
              id: '5'
            }
          ]
        },
        recommendation: {
          listId: 'recom',
          items: [
            {
              id: '4'
            },
            {
              id: '5'
            }
          ]
        },
        cart: {
          lineItems: [
            {
              product: {
                id: '6'
              },
              quantity: 2
            }
          ]
        }
      };
    });

    it('should not get product from product key', () => {
      assert.ok(!DDHelper.getListItem('1', _digitalData));
    });

    it('should get product from listing key', () => {
      assert.ok(DDHelper.getListItem('2', _digitalData).product.id === '2');
    });

    it('should get product from recommendation key', () => {
      assert.ok(DDHelper.getListItem('4', _digitalData).product.id === '4');
    });

    it('should get product from recommendation key from list "recom"', () => {
      assert.ok(DDHelper.getListItem('5', _digitalData, 'recom').product.id === '5');
      assert.ok(DDHelper.getListItem('5', _digitalData, 'recom').listId === 'recom');
    });

    it('should not get product from cart key', () => {
      assert.ok(!DDHelper.getListItem('6', _digitalData));
    });
  });

  describe('#getCampaign', () => {
    before(() => {
      _digitalData = {
        page: {
          type: 'category'
        },
        user: {
          email: 'text@email.com',
          userId: '123'
        },
        campaigns: [
          {
            id: '1'
          },
          {
            id: '2'
          }
        ]
      };
    });

    it('should get campaign from campaigns key', () => {
      assert.ok(DDHelper.getCampaign('1', _digitalData).id === '1');
    });

  });

});
