import assert from 'assert';
import deleteProperty from './../src/functions/deleteProperty.js';
import EventDataEnricher from './../src/EventDataEnricher.js';

describe('EventDataEnricher', () => {

  let _digitalData;

  describe('#product', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
    });

    describe('using "product" DDL var', () => {

      beforeEach(() => {
        _digitalData.product = {
          id: '123',
          name: 'Test Product',
          unitPrice: 10000
        };
      });

      afterEach(() => {
        deleteProperty(_digitalData, 'product');
        deleteProperty(_digitalData, 'listing');
        deleteProperty(_digitalData, 'recommendation');
      });

      it('should enrich product by id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(_digitalData.product.unitPrice === 10000, 'DDL product.unitPrice is not equal to 10000');
      });
    });

    describe('using "listing" DDL var', () => {

      beforeEach(() => {
        _digitalData.listing = {
          items: [
            {
              id: '123',
              name: 'Test Product',
              unitPrice: 10000
            },
            {
              id: '234',
              name: 'Test Product 2',
              unitPrice: 10000
            }
          ]
        };
      });

      afterEach(() => {
        deleteProperty(_digitalData, 'product');
        deleteProperty(_digitalData, 'listing');
        deleteProperty(_digitalData, 'recommendation');
      });

      it('should enrich product by id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product array by id', () => {
        const event = {
          name: 'Viewed Product',
          category: 'Ecommerce',
          product: ['123', '234']
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product[0].id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product[0].name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product[0].unitPrice === 10000, 'product.unitPrice is not equal to 10000');
        assert.ok(event.product[1].id === '234', 'product.id is is not equal to "234"');
        assert.ok(event.product[1].name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        assert.ok(event.product[1].unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(_digitalData.listing.items[0].unitPrice === 10000, 'DDL listing.items[0].unitPrice is not equal to 10000');
      });

      it('should enrich product array by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: [
            {
              id: '123',
              unitPrice: 11000,
              unitSalePrice: 11000
            },
            {
              id: '234',
              unitPrice: 11000,
              unitSalePrice: 11000
            }
          ]
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product[0].id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product[0].name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product[0].unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product[0].unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(event.product[1].id === '234', 'product.id is is not equal to "234"');
        assert.ok(event.product[1].name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        assert.ok(event.product[1].unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product[1].unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(_digitalData.listing.items[0].unitPrice === 10000, 'DDL listing.items[0].unitPrice is not equal to 10000');
      });
    });


    describe('using "recommendation" DDL var', () => {

      beforeEach(() => {
        _digitalData.recommendation = {
          items: [
            {
              id: '123',
              name: 'Test Product',
              unitPrice: 10000
            }
          ]
        };
      });

      afterEach(() => {
        deleteProperty(_digitalData, 'product');
        deleteProperty(_digitalData, 'listing');
        deleteProperty(_digitalData, 'recommendation');
      });

      it('should enrich product by id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(_digitalData.recommendation.items[0].unitPrice === 10000, 'DDL recommendation.items[0].unitPrice is not equal to 10000');
      });
    });

    describe('using "listing" DDL var which is an array of listings', () => {

      beforeEach(() => {
        _digitalData.listing = [
          {
            items: [
              {
                id: '123',
                name: 'Test Product',
                unitPrice: 10000
              }
            ]
          }
        ];
      });

      afterEach(() => {
        deleteProperty(_digitalData, 'product');
        deleteProperty(_digitalData, 'listing');
        deleteProperty(_digitalData, 'recommendation');
      });

      it('should enrich product by id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '123'
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
      });

      it('should enrich product by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitPrice: 11000,
            unitSalePrice: 11000
          }
        };

        event.product = EventDataEnricher.product(event.product, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.product);
        assert.ok(event.product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(_digitalData.listing[0].items[0].unitPrice === 10000, 'DDL listing[0].items[0].unitPrice is not equal to 10000');
      });
    });

  });


  describe('#transaction', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        transaction: {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '123'
              },
              quantity: 2
            }
          ],
          total: 10000,
          subtotal: 10000
        },
        events: []
      };
    });

    it('should enrich transaction when transaction is empty', () => {
      const event = {
        name: 'Completed Transaction',
        category: 'Ecommerce'
      };

      event.transaction = EventDataEnricher.transaction(event.transaction, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.transaction);
      assert.ok(event.transaction.orderId === '123', 'transaction.orderId is is not equal to "123"');
      assert.ok(event.transaction.lineItems.length === 1, 'transaction.lineItemsLength is is not equal to 1');
    });

    it('should enrich transaction when transaction is not empty', () => {
      const event = {
        name: 'Completed Transaction',
        category: 'Ecommerce',
        transaction: {
          oderId: '123',
          subtotal: 11000
        }
      };

      event.transaction = EventDataEnricher.transaction(event.transaction, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.transaction);
      assert.ok(event.transaction.orderId === '123', 'transaction.orderId is is not equal to "123"');
      assert.ok(event.transaction.subtotal === 11000, 'transaction.subtital is is not equal to 11000');
      assert.ok(event.transaction.lineItems.length === 1, 'transaction.lineItemsLength is is not equal to 1');
    });

  });


  describe('#campaign', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        campaigns: [
          {
            id: '123',
            name: 'Campaign 1',
            category: 'Banner'
          },
          {
            id: '234',
            name: 'Campaign 2',
            category: 'Banner'
          }
        ],
        events: []
      };
    });

    it('should enrich campaign by id', () => {
      const event = {
        name: 'Clicked Campaign',
        category: 'Promo',
        campaign: '123'
      };

      event.campaign = EventDataEnricher.campaign(event.campaign, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaign);
      assert.ok(event.campaign.id === '123', 'campaign.id is not equal to "123"');
      assert.ok(event.campaign.name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
    });

    it('should enrich campaign by campaign.id', () => {
      const event = {
        name: 'Clicked Campaign',
        category: 'Promo',
        campaign: {
          id: '123',
          category: 'Banner 2',
          description: 'Lorem ipsum'
        }
      };

      event.campaign = EventDataEnricher.campaign(event.campaign, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaign);
      assert.ok(event.campaign.id === '123', 'campaign.id is is not equal to "123"');
      assert.ok(event.campaign.name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaign.category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      assert.ok(event.campaign.description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      assert.ok(_digitalData.campaigns[0].category === 'Banner', 'digitalData.campaigns[0].category is not equal to "Banner"');
    });

    it('should enrich campaign array by id', () => {
      const event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaign: ['123', '234']
      };

      event.campaign = EventDataEnricher.campaign(event.campaign, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaign);
      assert.ok(event.campaign[0].id === '123', 'campaign.id is not equal to "123"');
      assert.ok(event.campaign[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaign[1].id === '234', 'campaign.id is not equal to "123"');
      assert.ok(event.campaign[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
    });

    it('should enrich campaign array by campaign.id', () => {
      const event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaign: [
          {
            id: '123',
            category: 'Banner 2',
            description: 'Lorem ipsum'
          },
          {
            id: '234',
            category: 'Banner 2',
            description: 'Lorem ipsum'
          }
        ]
      };

      event.campaign = EventDataEnricher.campaign(event.campaign, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaign);
      assert.ok(event.campaign[0].id === '123', 'campaign.id is is not equal to "123"');
      assert.ok(event.campaign[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaign[0].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      assert.ok(event.campaign[0].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      assert.ok(event.campaign[1].id === '234', 'campaign.id is is not equal to "123"');
      assert.ok(event.campaign[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaign[1].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      assert.ok(event.campaign[1].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      assert.ok(_digitalData.campaigns[0].category === 'Banner', 'digitalData.campaigns[0].category is not equal to "Banner"');
    });

  });

  describe('#user', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        user: {
          firstName: 'John',
          lastName: 'Dow',
          isLoggedIn: true,
          email: 'example@driveback.ru'
        },
        events: []
      };
    });

    it('should enrich user when user is empty', () => {
      const event = {
        name: 'Subscribed',
        category: 'Email'
      };

      event.user = EventDataEnricher.user(event.user, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.user);
      assert.ok(event.user.isLoggedIn === true, 'user.isLoggedIn is not equal to TRUE');
      assert.ok(event.user.firstName === 'John', 'user.firstName is not equal to "John"');
      assert.ok(event.user.lastName === 'Dow', 'user.lastName is not equal to "Dow"');
      assert.ok(event.user.email === 'example@driveback.ru', 'user.email is is not equal to "example@driveback.ru"');
    });

    it('should enrich user when user is not empty', () => {
      const event = {
        name: 'Subscribed',
        category: 'Email',
        user: {
          email: 'example2@driveback.ru'
        }
      };

      event.user = EventDataEnricher.user(event.user, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.user);
      assert.ok(event.user.isLoggedIn === true, 'user.isLoggedIn is not equal to TRUE');
      assert.ok(event.user.firstName === 'John', 'user.firstName is not equal to "John"');
      assert.ok(event.user.lastName === 'Dow', 'user.lastName is not equal to "Dow"');
      assert.ok(event.user.email === 'example2@driveback.ru', 'user.email is is not equal to "example2@driveback.ru"');
    });

  });

  describe('#page', () => {

    before(() => {
      _digitalData = {
        page: {
          type: 'category',
          categoryId: '123'
        },
        events: []
      };
    });

    it('should enrich user when user is empty', () => {
      const event = {
        name: 'Viewed Page',
        category: 'Content'
      };

      event.page = EventDataEnricher.page(event.page, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.page);
      assert.ok(event.page.type === 'category', 'page.type is not equal to "category"');
      assert.ok(event.page.categoryId === '123', 'page.categoryId is not equal to "123"');
    });

    it('should enrich user when user is not empty', () => {
      const event = {
        name: 'Subscribed',
        category: 'Email',
        page: {
          categoryId: '234',
          url: 'http://example.com'
        }
      };

      event.page = EventDataEnricher.page(event.page, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.page);
      assert.ok(event.page.type === 'category', 'page.type is not equal to "category"');
      assert.ok(event.page.categoryId === '234', 'page.categoryId is not equal to "234"');
      assert.ok(event.page.url === 'http://example.com', 'page.categoryId is not equal to "http://example.com"');
    });

  });

});