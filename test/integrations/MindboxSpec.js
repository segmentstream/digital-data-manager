import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Mindbox from './../../src/integrations/Mindbox';
import ddManager from './../../src/ddManager';
import noop from 'driveback-utils/noop';

describe('Integrations: Mindbox', () => {
  let mindbox;
  const options = {
    projectSystemName: 'Test',
    brandSystemName: 'drivebackru',
    pointOfContactSystemName: 'test-services.mindbox.ru',
    projectDomain: 'test.com',
    userIdProvider: 'TestWebsiteId',
    endpointId: 'endpointId',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: [],
    };
    mindbox = new Mindbox(window.digitalData, options);
    ddManager.addIntegration('Mindbox', mindbox);
  });

  afterEach(() => {
    mindbox.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.equal(options.projectSystemName, mindbox.getOption('projectSystemName'));
        assert.equal(options.brandSystemName, mindbox.getOption('brandSystemName'));
        assert.equal(options.pointOfContactSystemName, mindbox.getOption('pointOfContactSystemName'));
        assert.equal(options.projectDomain, mindbox.getOption('projectDomain'));
      });
    });

    describe('#initialize', () => {
      it('should preapre stubs', () => {
        sinon.stub(mindbox, 'load', () => {
          mindbox.onLoad();
        });
        ddManager.initialize();
        assert.ok(typeof window.mindbox === 'function');
        assert.ok(window.mindbox.queue);
      });

      it('should create V2 tracker', () => {
        window.mindbox = noop;
        sinon.stub(window, 'mindbox');
        sinon.stub(mindbox, 'load', () => {
          mindbox.onLoad();
        });
        ddManager.initialize();
        assert.ok(window.mindbox.calledWith('create', {
          projectSystemName: mindbox.getOption('projectSystemName'),
          brandSystemName: mindbox.getOption('brandSystemName'),
          pointOfContactSystemName: mindbox.getOption('pointOfContactSystemName'),
          projectDomain: mindbox.getOption('projectDomain'),
        }));
      });

      it('should create V3 tracker', () => {
        mindbox.setOption('apiVersion', 'V3');
        window.mindbox = noop;
        sinon.stub(window, 'mindbox');
        sinon.stub(mindbox, 'load', () => {
          mindbox.onLoad();
        });
        ddManager.initialize();
        assert.ok(window.mindbox.calledWith('create', {
          endpointId: mindbox.getOption('endpointId'),
        }));
      });
    });
  });

  describe('after loading V2', () => {
    beforeEach((done) => {
      sinon.stub(mindbox, 'load', () => {
        mindbox.onLoad();
      });
      ddManager.once('ready', done);
      ddManager.initialize();

      sinon.spy(window, 'mindbox');
    });

    afterEach(() => {
      window.mindbox.restore();
    });

    describe('#onViewedPage', () => {
      beforeEach(() => {
        mindbox.setOption('setCartOperation', 'SetCart');
      });

      it('should track cart if set cart operation defined', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          cart: {
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 1000,
                  skuCode: 'sku123',
                },
                quantity: 2,
              },
              {
                product: {
                  id: '234',
                  unitSalePrice: 1000,
                  skuCode: 'sku234',
                },
                quantity: 1,
              },
            ],
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'SetCart',
              data: {
                action: {
                  personalOffers: [
                    {
                      productId: '123',
                      count: 2,
                      price: 2000
                    },
                    {
                      productId: '234',
                      count: 1,
                      price: 1000
                    }
                  ],
                }
              },
            }));
          }
        })
      });
    });

    describe('#onViewedProductDetail', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Detail': 'ViewProduct',
        });
      });

      it('should track viewed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'ViewProduct',
              data: {
                action: {
                  productId: '123'
                },
              },
            }));
          }
        });
      });

      it('should track viewed product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          integrations: {
            mindbox: {
              operation: 'ViewedProductCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'ViewedProductCustom',
              data: {
                action: {
                  productId: '123'
                },
              },
            }));
          }
        });
      });

    });


    describe('#onAddedProduct', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Added Product': 'AddProduct',
        });
      });

      it('should track added product with default operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500,
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'AddProduct',
              data: {
                action: {
                  productId: '123',
                  price: 2500
                },
              },
            }));
          }
        });
      });

      it('should track added product with custom product variables', () => {
        mindbox.setOption('productVars', {
          skuId: 'skuCode',
        });
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500,
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'AddProduct',
              data: {
                action: {
                  productId: '123',
                  skuId: 'sku123',
                  price: 2500
                },
              },
            }));
          }
        });
      });

      it('should track added product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500,
          },
          quantity: 5,
          integrations: {
            mindbox: {
              operation: 'AddProductCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'AddProductCustom',
              data: {
                action: {
                  productId: '123',
                  price: 2500,
                },
              },
            }));
          }
        });
      });

    });


    describe('#onViewedProductListing', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Listing': 'CategoryView',
        });
      });

      it('should track viewed product listing with default operation', () => {
        window.digitalData.listing = {
          categoryId: '123',
        };
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'CategoryView',
              data: {
                action: {
                  productCategoryId: '123',
                },
              },
            }));
          }
        });
      });

      it('should track viewed product listing with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123',
          },
          integrations: {
            mindbox: {
              operation: 'CategoryViewCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'CategoryViewCustom',
              data: {
                action: {
                  productCategoryId: '123',
                },
              },
            }));
          }
        });
      });

    });


    describe('#onRemovedProduct', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Removed Product': 'RemoveProduct',
        });
      });

      it('should track removed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500,
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'RemoveProduct',
              data: {
                action: {
                  productId: '123',
                  price: 2500,
                },
              },
            }));
          }
        });
      });

      it('should track added product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500,
          },
          quantity: 5,
          integrations: {
            mindbox: {
              operation: 'AddProductCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', {
              operation: 'AddProductCustom',
              data: {
                action: {
                  productId: '123',
                  price: 2500,
                },
              },
            }));
          }
        });
      });

    });

    describe('#onCompletedTransaction', () => {

      const transaction = {
        orderId: '123',
        lineItems: [
          {
            product: {
              id: '123',
              skuCode: 'sku123',
              unitSalePrice: 100
            },
            quantity: 1
          },
          {
            product: {
              id: '234',
              skuCode: 'sku234',
              unitSalePrice: 150
            },
            quantity: 2
          },
        ],
        shippingMethod: 'Courier',
        paymentMethod: 'Visa',
        total: 5000
      };

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Completed Transaction': 'CompletedOrder',
        });
      });

      it('should track completed transaction with default operation', () => {
        window.digitalData.user = {
          userId: 'user123'
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'CompletedOrder',
              identificator: {
                provider: 'TestWebsiteId',
                identity: 'user123',
              },
              data: {
                order: {
                  webSiteId: '123',
                  price: 5000,
                  deliveryType: 'Courier',
                  paymentType: 'Visa',
                  items: [
                    {
                      productId: '123',
                      skuId: 'sku123',
                      quantity: 1,
                      price: 100,
                    },
                    {
                      productId: '234',
                      skuId: 'sku234',
                      quantity: 2,
                      price: 150,
                    }
                  ]
                },
              },
            }));
          }
        });
      });

      it('should track completed transaction with default custom operation', () => {
        window.digitalData.user = {
          userId: 'user123'
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          integrations: {
            mindbox: {
              operation: 'CompletedOrderCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'CompletedOrderCustom',
              identificator: {
                provider: 'TestWebsiteId',
                identity: 'user123',
              },
              data: {
                order: {
                  webSiteId: '123',
                  price: 5000,
                  deliveryType: 'Courier',
                  paymentType: 'Visa',
                  items: [
                    {
                      productId: '123',
                      skuId: 'sku123',
                      quantity: 1,
                      price: 100,
                    },
                    {
                      productId: '234',
                      skuId: 'sku234',
                      quantity: 2,
                      price: 150,
                    }
                  ]
                },
              },
            }));
          }
        });
      });

    });

    describe('#onSubscribed and #onRegistered', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Subscribed': 'EmailSubscribe',
          'Registered': 'Registration',
          'Updated Profile Info': 'UpdateProfile',
        });
        mindbox.setOption('userVars', {
          'email': {
            type: 'digitalData',
            value: 'user.email'
          },
          'firstName': {
            type: 'digitalData',
            value: 'user.firstName'
          },
          'lastName': {
            type: 'digitalData',
            value: 'user.lastName'
          },
        });
        mindbox.prepareEnrichableUserIds();
        mindbox.prepareEnrichableUserProps();
      });

      it('should track subscription with default operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'EmailSubscribe',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru'
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
                subscriptions: [
                  {
                    pointOfContact: 'Email',
                    isSubscribed: true,
                    valueByDefault: true,
                  },
                ]
              },
            }));
          },
        });
      });

      it('should track subscription with custom operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          integrations: {
            mindbox: {
              operation: 'EmailSubscribeCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'EmailSubscribeCustom',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru'
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
                subscriptions: [
                  {
                    pointOfContact: 'Email',
                    isSubscribed: true,
                    valueByDefault: true,
                  },
                ]
              },
            }));
          },
        });
      });

      it('should track registration with default operation', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'Registration',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru',
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
              },
            }));
          },
        });
      });

      it('should track registration with custom operation', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          integrations: {
            mindbox: {
              operation: 'RegistrationCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'RegistrationCustom',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru'
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
              },
            }));
          }
        });
      });

      it('should track registration with subscription to email and sms', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            isSubscribed: true,
            isSubscribedBySms: true,
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'Registration',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru'
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
                subscriptions: [
                  {
                    pointOfContact: 'Email',
                    isSubscribed: true,
                    valueByDefault: true
                  },
                  {
                    pointOfContact: 'Sms',
                    isSubscribed: true,
                    valueByDefault: true
                  }
                ]
              },
            }));
          }
        });
      });

      it('should track update profile info with subscription to email and sms', () => {
        window.digitalData.events.push({
          name: 'Updated Profile Info',
          user: {
            isSubscribed: true,
            isSubscribedBySms: true,
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'UpdateProfile',
              identificator: {
                provider: 'email',
                identity: 'test@driveback.ru'
              },
              data: {
                email: 'test@driveback.ru',
                firstName: 'John',
                lastName: 'Dow',
                subscriptions: [
                  {
                    pointOfContact: 'Email',
                    isSubscribed: true,
                  },
                  {
                    pointOfContact: 'Sms',
                    isSubscribed: true,
                  }
                ]
              },
            }));
          }
        });
      });
    });

    describe('#onLoggedIn', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Logged In': 'EnterWebsite',
        });
        window.digitalData.user = {
          userId: '123',
        };
      });

      it('should track authorization with default operation', () => {
        window.digitalData.events.push({
          name: 'Logged In',
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'EnterWebsite',
              identificator: {
                provider: 'TestWebsiteId',
                identity: '123',
              },
              data: {},
            }));
          },
        });
      });
    });
  });

  describe('after loading V3', () => {
    beforeEach((done) => {
      mindbox.setOption('apiVersion', 'V3');
      mindbox.setOption('productIdsMapping', {
        bitrixId: 'id',
      });
      mindbox.setOption('customerIdsMapping', {
        bitrixId: {
          type: 'digitalData',
          value: 'user.userId',
        },
      });
      mindbox.setOption('areaIdsMapping', {
        externalId: {
          type: 'digitalData',
          value: 'website.regionId',
        },
      });
      mindbox.setOption('productSkuIdsMapping', {
        bitrixId: 'skuCode',
      });
      mindbox.setOption('productCategoryIdsMapping', {
        bitrixId: 'listing.categoryId',
      });
      mindbox.prepareEnrichableUserIds();
      mindbox.prepareEnrichableUserProps();
      sinon.stub(mindbox, 'load', () => {
        mindbox.onLoad();
      });
      ddManager.once('ready', done);
      ddManager.initialize();
      sinon.stub(window, 'mindbox');
    });

    afterEach(() => {
      window.mindbox.restore();
    });

    describe('#onViewedPage', () => {
      const cart = {
        lineItems: [
          {
            product: {
              id: '123',
              unitSalePrice: 1000,
              skuCode: 'sku123',
            },
            quantity: 2,
          },
          {
            product: {
              id: '234',
              unitSalePrice: 1000,
              skuCode: 'sku234',
            },
            quantity: 1,
          },
        ],
      };
      const productList = [
        {
          product: {
            ids: {
              bitrixId: '123',
            },
            sku: {
              ids: {
                bitrixId: 'sku123',
              },
            },
          },
          count: 2,
          price: 2000,
        },
        {
          product: {
            ids: {
              bitrixId: '234',
            },
            sku: {
              ids: {
                bitrixId: 'sku234',
              },
            },
          },
          count: 1,
          price: 1000,
        },
      ];

      beforeEach(() => {
        mindbox.setOption('setCartOperation', 'SetCart');
      });

      it('should track cart if set cart operation defined (no customer)', () => {
        window.digitalData.cart = cart;
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'SetCart',
              data: {
                productList,
              },
            }));
          },
        });
      });

      it('should track cart if set cart operation defined (authenticated customer)', () => {
        window.digitalData.user = {
          userId: 'user123',
        };
        window.digitalData.cart = cart;
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'SetCart',
              data: {
                customer: {
                  ids: {
                    bitrixId: 'user123',
                  },
                },
                productList,
              },
            }));
          },
        });
      });
    });

    describe('#onViewedProductDetail', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Detail': 'ViewProduct',
        });
      });

      it('should track viewed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'ViewProduct',
              data: {
                product: {
                  ids: {
                    bitrixId: '123',
                  },
                },
              },
            }));
          },
        });
      });

      it('should track viewed product with default operation and sku', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            skuCode: 'sku123',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'ViewProduct',
              data: {
                product: {
                  ids: {
                    bitrixId: '123',
                  },
                  sku: {
                    ids: {
                      bitrixId: 'sku123',
                    },
                  },
                },
              },
            }));
          },
        });
      });

      it('should track viewed product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
          },
          integrations: {
            mindbox: {
              operation: 'ViewedProductCustom',
            },
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'ViewedProductCustom',
              data: {
                product: {
                  ids: {
                    bitrixId: '123',
                  },
                },
              },
            }));
          },
        });
      });
    });


    describe('#onAddedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Added Product': 'AddProduct',
        });
      });

      it('should track added product with default operation', () => {
        // TODO should track as custom event
        assert.ok(true);
      });
    });


    describe('#onViewedProductListing', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Listing': 'CategoryView',
        });
      });

      it('should track viewed product listing with default operation', () => {
        window.digitalData.listing = {
          categoryId: '123',
        };
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'CategoryView',
              data: {
                productCategory: {
                  ids: {
                    bitrixId: '123',
                  },
                },
              },
            }));
          },
        });
      });

      it('should track viewed product listing with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123',
          },
          operation: 'CategoryViewCustom',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'CategoryViewCustom',
              data: {
                productCategory: {
                  ids: {
                    bitrixId: '123',
                  },
                },
              },
            }));
          },
        });
      });
    });


    describe('#onRemovedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Removed Product': 'RemoveProduct',
        });
      });

      it('should track removed product with default operation', () => {
        // TODO should track as custom event
        assert.ok(true);
      });
    });

    describe('#onCompletedTransaction', () => {

      const transaction = {
        orderId: '123',
        lineItems: [
          {
            product: {
              id: '123',
              skuCode: 'sku123',
              unitSalePrice: 100,
            },
            quantity: 1,
          },
          {
            product: {
              id: '234',
              skuCode: 'sku234',
              unitSalePrice: 150,
            },
            quantity: 2,
          },
        ],
        shippingMethod: 'Courier',
        paymentMethod: 'Visa',
        customField: 'test',
        total: 5000,
      };

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Completed Transaction': 'CompletedOrder',
        });
        mindbox.setOption('orderVars', {
          oneMoreField: 'transaction.customField',
        });
      });

      it('should track completed transaction with default operation', () => {
        window.digitalData.user = {
          userId: 'user123',
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'CompletedOrder',
              identificator: {
                provider: 'TestWebsiteId',
                identity: 'user123',
              },
              data: {
                order: {
                  webSiteId: '123',
                  price: 5000,
                  deliveryType: 'Courier',
                  paymentType: 'Visa',
                  oneMoreField: 'test',
                  items: [
                    {
                      productId: '123',
                      skuId: 'sku123',
                      quantity: 1,
                      price: 100,
                    },
                    {
                      productId: '234',
                      skuId: 'sku234',
                      quantity: 2,
                      price: 150,
                    },
                  ],
                },
              },
            }));
          }
        });
      });

      it('should track completed transaction with default custom operation', () => {
        window.digitalData.user = {
          userId: 'user123',
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          integrations: {
            mindbox: {
              operation: 'CompletedOrderCustom'
            },
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', {
              operation: 'CompletedOrderCustom',
              identificator: {
                provider: 'TestWebsiteId',
                identity: 'user123',
              },
              data: {
                order: {
                  webSiteId: '123',
                  price: 5000,
                  deliveryType: 'Courier',
                  paymentType: 'Visa',
                  oneMoreField: 'test',
                  items: [
                    {
                      productId: '123',
                      skuId: 'sku123',
                      quantity: 1,
                      price: 100,
                    },
                    {
                      productId: '234',
                      skuId: 'sku234',
                      quantity: 2,
                      price: 150,
                    },
                  ],
                },
              },
            }));
          },
        });
      });
    });

    describe('#onSubscribed and #onRegistered', () => {
      const registeredUser = {
        userId: 'user123',
        email: 'test@driveback.ru',
        phone: '79374134389',
        firstName: 'John',
        lastName: 'Dow',
        childrenNames: ['Helen', 'Bob'],
        city: 'Moscow',
        b2b: true,
      };

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          Subscribed: 'EmailSubscribe',
          Registered: 'Registration',
        });
        mindbox.setOption('userVars', {
          email: {
            type: 'digitalData',
            value: 'user.email',
          },
          firstName: {
            type: 'digitalData',
            value: 'user.firstName',
          },
          lastName: {
            type: 'digitalData',
            value: 'user.lastName',
          },
          source: {
            type: 'event',
            value: 'source',
          },
          city: {
            type: 'digitalData',
            value: 'user.city',
          },
          childrenNames: {
            type: 'digitalData',
            value: 'user.childrenNames',
          },
          b2b: {
            type: 'digitalData',
            value: 'user.b2b',
          },
        });
        mindbox.prepareEnrichableUserIds();
        mindbox.prepareEnrichableUserProps();
      });

      it('should track subscription with default operation', () => {
        window.digitalData.website = {
          regionId: 'region123',
        };
        window.digitalData.events.push({
          name: 'Subscribed',
          source: 'Driveback',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'EmailSubscribe',
              data: {
                customer: {
                  email: 'test@driveback.ru',
                  firstName: 'John',
                  lastName: 'Dow',
                  customFields: {
                    source: 'Driveback',
                  },
                  area: {
                    ids: {
                      externalId: 'region123',
                    },
                  },
                  subscriptions: [
                    {
                      pointOfContact: 'Email',
                      isSubscribed: true,
                      valueByDefault: true,
                    },
                  ],
                },
              },
            }));
          },
        });
      });

      it('should track subscription with custom operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          operation: 'EmailSubscribeCustom',
          source: 'Driveback',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'EmailSubscribeCustom',
              data: {
                customer: {
                  email: 'test@driveback.ru',
                  firstName: 'John',
                  lastName: 'Dow',
                  customFields: {
                    source: 'Driveback',
                  },
                  subscriptions: [
                    {
                      pointOfContact: 'Email',
                      isSubscribed: true,
                      valueByDefault: true,
                    },
                  ],
                },
              },
            }));
          },
        });
      });

      it('should track registration with default operation', () => {
        window.digitalData.user = registeredUser;
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'Registration',
              data: {
                customer: {
                  ids: {
                    bitrixId: 'user123',
                  },
                  firstName: 'John',
                  lastName: 'Dow',
                  email: 'test@driveback.ru',
                  customFields: {
                    source: 'Driveback',
                    city: 'Moscow',
                    b2b: true,
                    childrenNames: [
                      'Helen',
                      'Bob',
                    ],
                  },
                },
              },
            }));
          },
        });
      });

      it('should track registration with custom operation', () => {
        window.digitalData.user = registeredUser;
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          operation: 'RegistrationCustom',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'RegistrationCustom',
              data: {
                customer: {
                  ids: {
                    bitrixId: 'user123',
                  },
                  firstName: 'John',
                  lastName: 'Dow',
                  email: 'test@driveback.ru',
                  customFields: {
                    source: 'Driveback',
                    city: 'Moscow',
                    b2b: true,
                    childrenNames: [
                      'Helen',
                      'Bob',
                    ],
                  },
                },
              },
            }));
          },
        });
      });

      it('should track registration with subscription to email and sms', () => {
        window.digitalData.user = {
          ...registeredUser,
          isSubscribed: true,
          isSubscribedBySms: true,
        };
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'Registration',
              data: {
                customer: {
                  ids: {
                    bitrixId: 'user123',
                  },
                  firstName: 'John',
                  lastName: 'Dow',
                  email: 'test@driveback.ru',
                  customFields: {
                    source: 'Driveback',
                    city: 'Moscow',
                    b2b: true,
                    childrenNames: [
                      'Helen',
                      'Bob',
                    ],
                  },
                  subscriptions: [
                    {
                      pointOfContact: 'Email',
                      isSubscribed: true,
                      valueByDefault: true,
                    },
                    {
                      pointOfContact: 'Sms',
                      isSubscribed: true,
                      valueByDefault: true,
                    },
                  ],
                },
              },
            }));
          },
        });
      });
    });


    describe('#onLoggedIn', () => {

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Logged In': 'EnterWebsite',
        });
        mindbox.setOption('userVars', {
          email: {
            type: 'digitalData',
            value: 'user.email',
          },
          mobilePhone: {
            type: 'digitalData',
            value: 'user.phone',
          },
        });
        window.digitalData.user = {
          userId: 'user123',
          email: 'test@driveback.ru',
          phone: '74957777777',
        };
        mindbox.prepareEnrichableUserIds();
        mindbox.prepareEnrichableUserProps();
      });

      it('should track authorization with default operation', () => {
        window.digitalData.events.push({
          name: 'Logged In',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', {
              operation: 'EnterWebsite',
              data: {
                customer: {
                  ids: {
                    bitrixId: 'user123',
                  },
                  email: 'test@driveback.ru',
                  mobilePhone: '74957777777',
                },
              },
            }));
          },
        });
      });
    });
  });
});
