import assert from 'assert';
import deleteProperty from '@segmentstream/utils/deleteProperty.js';
import EventDataEnricher from './../src/enrichments/EventDataEnricher.js';
import Emarsys from './../src/integrations/Emarsys';

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

      it('should enrich products array by id', () => {
        const event = {
          name: 'Viewed Product',
          category: 'Ecommerce',
          listItems: [
            {
              product: '123'
            },
            {
              product: '234'
            },
          ]
        };

        event.listItems = EventDataEnricher.listItems(event.listItems, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.listItems);
        assert.ok(event.listItems[0].product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.listItems[0].product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.listItems[0].product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
        assert.ok(event.listItems[1].product.id === '234', 'product.id is is not equal to "234"');
        assert.ok(event.listItems[1].product.name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        assert.ok(event.listItems[1].product.unitPrice === 10000, 'product.unitPrice is not equal to 10000');
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

      it('should enrich listItems array by product.id', () => {
        const event = {
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          listItems: [
            {
              product: {
                id: '123',
                unitPrice: 11000,
                unitSalePrice: 11000
              }
            },
            {
              product: {
                id: '234',
                unitPrice: 11000,
                unitSalePrice: 11000
              }
            }
          ]
        };

        event.listItems = EventDataEnricher.listItems(event.listItems, _digitalData);

        assert.ok(event.name);
        assert.ok(event.category);
        assert.ok(event.listItems);
        assert.ok(event.listItems[0].product.id === '123', 'product.id is is not equal to "123"');
        assert.ok(event.listItems[0].product.name === 'Test Product', 'product.name is not equal to "Test Product"');
        assert.ok(event.listItems[0].product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.listItems[0].product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
        assert.ok(event.listItems[1].product.id === '234', 'product.id is is not equal to "234"');
        assert.ok(event.listItems[1].product.name === 'Test Product 2', 'product.name is not equal to "Test Product 2"');
        assert.ok(event.listItems[1].product.unitPrice === 11000, 'product.unitPrice is not equal to 11000');
        assert.ok(event.listItems[1].product.unitSalePrice === 11000, 'product.unitSalePrice is not equal to 11000');
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

    it('should enrich campaigns array by id', () => {
      const event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaigns: ['123', '234']
      };

      event.campaigns = EventDataEnricher.campaigns(event.campaigns, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaigns);
      assert.ok(event.campaigns[0].id === '123', 'campaign.id is not equal to "123"');
      assert.ok(event.campaigns[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaigns[1].id === '234', 'campaign.id is not equal to "123"');
      assert.ok(event.campaigns[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
    });

    it('should enrich campaigns array by campaign.id', () => {
      const event = {
        name: 'Viewed Campaign',
        category: 'Promo',
        campaigns: [
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

      event.campaigns = EventDataEnricher.campaigns(event.campaigns, _digitalData);

      assert.ok(event.name);
      assert.ok(event.category);
      assert.ok(event.campaigns);
      assert.ok(event.campaigns[0].id === '123', 'campaign.id is is not equal to "123"');
      assert.ok(event.campaigns[0].name === 'Campaign 1', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaigns[0].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      assert.ok(event.campaigns[0].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      assert.ok(event.campaigns[1].id === '234', 'campaign.id is is not equal to "123"');
      assert.ok(event.campaigns[1].name === 'Campaign 2', 'campaign.name is not equal to "Campaign 1"');
      assert.ok(event.campaigns[1].category === 'Banner 2', 'campaign.category is not equal to "Banner 2"');
      assert.ok(event.campaigns[1].description === 'Lorem ipsum', 'campaign.category is not equal to "Lorem ipsum"');
      assert.ok(_digitalData.campaigns[0].category === 'Banner', 'digitalData.campaigns[0].category is not equal to "Banner"');
    });

  });

  describe('#enrichIntegrationData overrideFunctions', () => {
    const emarsys = new Emarsys(_digitalData, {
      merchantId: 'XXX',
      overrideFunctions: {
        product: function(product) {
          product.id = 's/' + product.id;
        },
        event: function(event) {
          if (event.name === 'Test') {
            event.prop1 = 'test2';
          }
        }
      }
    });

    it('should override event data', () => {
      const event = {
        name: 'Test',
        prop1: 'test1'
      };
      const enrichedEvent = EventDataEnricher.enrichIntegrationData(event, _digitalData, emarsys);
      assert.equal(enrichedEvent.prop1, 'test2');
    });

    it('should override product data', () => {
      const event = {
        name: 'Viewed Product Detail',
        product: {
          id: '123'
        }
      };
      const enrichedEvent = EventDataEnricher.enrichIntegrationData(event, _digitalData, emarsys);
      assert.equal(enrichedEvent.product.id, 's/123');
    });
  });

  describe('#enrichIntegrationData eventEnrichments', () => {
    const emarsys = new Emarsys(_digitalData, {
      merchantId: 'XXX',
      eventEnrichments: [
        { // old style
          prop: 'product.id',
          handler: function(event) {
            return 's/' + event.product.id;
          }
        },
        { // new style
          scope: 'event',
          prop: 'prop1',
          event: 'Test',
          handler: function(event) {
            return 'test2';
          }
        },
        { // new style
          scope: 'product',
          prop: 'id',
          handler: function(product) {
            return product.id + '!!!';
          }
        }
      ]
    });

    it('should override event data', () => {
      const event = {
        name: 'Test',
        prop1: 'test1'
      };
      const enrichedEvent = EventDataEnricher.enrichIntegrationData(event, _digitalData, emarsys);
      assert.equal(enrichedEvent.prop1, 'test2');
    });

    it('should override product data', () => {
      const event = {
        name: 'Viewed Product Detail',
        product: {
          id: '123',
        },
      };
      const enrichedEvent = EventDataEnricher.enrichIntegrationData(event, _digitalData, emarsys);
      assert.equal(enrichedEvent.product.id, 's/123!!!');
    });
  });

});
