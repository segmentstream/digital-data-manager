import assert from 'assert'
import sinon from 'sinon'
import noop from '@segmentstream/utils/noop'
import reset from '../../reset'
import Mindbox from '../../../src/integrations/Mindbox'
import ddManager from '../../../src/ddManager'

import { options, webPushWithCustowServiceWorkerOptions, expectedInitOptions } from './stubs/Mindbox.stub'
import V2Stubs from './stubs/v2'
import V3Stubs from './stubs/v3'

describe('Integrations: Mindbox web push manifest', () => {
  let mindbox
  const pushOptions = Object.assign({
    webpush: true,
    includeManifest: true,
    pushSubscriptionTriggerEvent: 'Viewed Page'
  }, options)

  beforeEach(() => {
    window.digitalData = {
      events: []
    }
    mindbox = new Mindbox(window.digitalData, pushOptions)
    ddManager.addIntegration('Mindbox', mindbox)
  })

  afterEach(() => {
    ddManager.reset()
    reset()
  })

  describe('on load with webpush and includeManifest options set', () => {
    beforeEach(() => {
      sinon.stub(mindbox, 'load')
      ddManager.initialize()
    })

    afterEach(() => {
      mindbox.load.restore()
    })

    it('should add webpush manifest', () => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          assert.ok(mindbox.load.calledWith('webpush'))
        }
      })
    })
  })

  describe('on load with webpush option set', () => {
    beforeEach(() => {
      mindbox.setOption('includeManifest', false)
      sinon.stub(mindbox, 'load')
      ddManager.initialize()
    })

    afterEach(() => {
      mindbox.load.restore()
    })

    it('should not add webpush manifest', () => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          assert.ok(!mindbox.load.calledWith('webpush'))
        }
      })
    })
  })
})

describe('Integrations: Mindbox web push', () => {
  let mindbox
  const pushOptions = Object.assign({
    webpush: true,
    pushSubscriptionTriggerEvent: 'Viewed Page'
  }, options)

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: []
    }
    mindbox = new Mindbox(window.digitalData, pushOptions)
    ddManager.addIntegration('Mindbox', mindbox)

    window.mindbox = noop
    sinon.stub(window, 'mindbox')
    sinon.stub(mindbox, 'load').callsFake(() => {
      mindbox.onLoad()
    })
    ddManager.initialize()
  })

  afterEach(() => {
    mindbox.reset()
    ddManager.reset()
    reset()
  })

  it('should load webpush if option set', () => {
    assert.ok(window.mindbox.calledWith('webpush.create'))
  })

  it('should call webpush subscription on trigger pushSubscriptionTriggerEvent', () => {
    window.digitalData.events.push({
      name: 'Viewed Page',
      callback: () => {
        assert.ok(window.mindbox.calledWith('webpush.subscribe', sinon.match.any))
      }
    })
  })
})

describe('Integrations: Mindbox web push with custom service worker path', () => {
  let mindbox
  const pushOptions = { ...webPushWithCustowServiceWorkerOptions, ...options }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: []
    }
    mindbox = new Mindbox(window.digitalData, pushOptions)
    ddManager.addIntegration('Mindbox', mindbox)

    window.mindbox = noop
    sinon.stub(window, 'mindbox')
    sinon.stub(mindbox, 'load').callsFake(() => {
      mindbox.onLoad()
    })
    ddManager.initialize()
  })

  afterEach(() => {
    mindbox.reset()
    ddManager.reset()
    reset()
  })

  it('should load webpush if option set', () => {
    assert.ok(window.mindbox.calledWith('webpush.create'))
  })

  it('should return true by hasCustomServiceWorkerPath method', () => {
    assert.ok(mindbox.hasCustomServiceWorkerPath())
  })

  it('should success set serviceWorkerPath option', () => {
    assert.ok(window.mindbox.firstCall.calledWith('create', expectedInitOptions))
  })
})

describe('Integrations: Mindbox', () => {
  let mindbox
  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: []
    }
    mindbox = new Mindbox(window.digitalData, options)
    ddManager.addIntegration('Mindbox', mindbox)
  })

  afterEach(() => {
    mindbox.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.strict.equal(options.projectSystemName, mindbox.getOption('projectSystemName'))
        assert.strict.equal(options.brandSystemName, mindbox.getOption('brandSystemName'))
        assert.strict.equal(options.pointOfContactSystemName, mindbox.getOption('pointOfContactSystemName'))
        assert.strict.equal(options.projectDomain, mindbox.getOption('projectDomain'))
      })
    })

    describe('#initialize', () => {
      it('should preapre stubs', () => {
        sinon.stub(mindbox, 'load').callsFake(() => {
          mindbox.onLoad()
        })
        ddManager.initialize()
        assert.ok(typeof window.mindbox === 'function')
        assert.ok(window.mindbox.queue)
      })

      it('should create V2 tracker', () => {
        window.mindbox = noop
        sinon.stub(window, 'mindbox')
        sinon.stub(mindbox, 'load').callsFake(() => {
          mindbox.onLoad()
        })
        ddManager.initialize()
        assert.ok(window.mindbox.calledWith('create', {
          projectSystemName: mindbox.getOption('projectSystemName'),
          brandSystemName: mindbox.getOption('brandSystemName'),
          pointOfContactSystemName: mindbox.getOption('pointOfContactSystemName'),
          projectDomain: mindbox.getOption('projectDomain')
        }))
      })

      it('should create V3 tracker', () => {
        mindbox.setOption('apiVersion', 'V3')
        window.mindbox = noop
        sinon.stub(window, 'mindbox')
        sinon.stub(mindbox, 'load').callsFake(() => {
          mindbox.onLoad()
        })
        ddManager.initialize()
        assert.ok(window.mindbox.calledWith('create', {
          endpointId: mindbox.getOption('endpointId')
        }))
      })
    })
  })

  describe('after loading V2', () => {
    beforeEach((done) => {
      sinon.stub(mindbox, 'load').callsFake(() => {
        mindbox.onLoad()
      })
      ddManager.once('ready', done)
      ddManager.initialize()

      sinon.spy(window, 'mindbox')
    })

    afterEach(() => {
      window.mindbox.restore()
    })

    describe('#onViewedPage', () => {
      beforeEach(() => {
        mindbox.setOption('setCartOperation', 'SetCart')
      })

      it('should track cart if set cart operation defined', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          cart: {
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 1000,
                  skuCode: 'sku123'
                },
                quantity: 2
              },
              {
                product: {
                  id: '234',
                  unitSalePrice: 1000,
                  skuCode: 'sku234'
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', V2Stubs.onViewedPageSetCardStub))
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Detail': 'ViewProduct'
        })
      })

      it('should track viewed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(
              window.mindbox.calledWith('performOperation', V2Stubs.onViewedProductDetailViewProductStub)
            )
          }
        })
      })

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
            assert.ok(window.mindbox.calledWith(
              'performOperation',
              V2Stubs.onViewedProductDetailViewedProductCustomStub
            ))
          }
        })
      })
    })

    describe('#onUpdatedCart', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Updated Cart': 'SetCart'
        })
      })

      it('should update cart', () => {
        window.digitalData.events.push({
          name: 'Updated Cart',
          cart: {
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 1000,
                  skuCode: 'sku123'
                },
                quantity: 2
              },
              {
                product: {
                  id: '234',
                  unitSalePrice: 1000,
                  skuCode: 'sku234'
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', V2Stubs.onUpdateCartSetCartStub))
          }
        })
      })
    })

    describe('#onAddedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Added Product': 'AddProduct'
        })
      })

      it('should track added product with default operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'performOperation',
              V2Stubs.onAddedProductAddProductStub
            ))
          }
        })
      })

      it('should track added product with custom product variables', () => {
        mindbox.setOption('productVars', {
          skuId: 'skuCode'
        })
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', V2Stubs.onAddedProductAddProductSkuStub))
          }
        })
      })

      it('should track added product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          integrations: {
            mindbox: {
              operation: 'AddProductCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'performOperation',
              V2Stubs.onAddedProductAddProductCustomStub
            ))
          }
        })
      })
    })

    describe('#onViewedProductListing', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Listing': 'CategoryView'
        })
      })

      it('should track viewed product listing with default operation', () => {
        window.digitalData.listing = {
          categoryId: '123'
        }
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'performOperation',
              V2Stubs.onViewedProductListingCategoryViewStub
            ))
          }
        })
      })

      it('should track viewed product listing with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123'
          },
          integrations: {
            mindbox: {
              operation: 'CategoryViewCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'performOperation',
              V2Stubs.onViewedProductListingCategoryViewCustomStub
            ))
          }
        })
      })
    })

    describe('#onRemovedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Removed Product': 'RemoveProduct'
        })
      })

      it('should track removed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', V2Stubs.onRemovedProductRemoveProductStub))
          }
        })
      })

      it('should track added product with custom operation', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          integrations: {
            mindbox: {
              operation: 'AddProductCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('performOperation', V2Stubs.onRemovedProductAddProductCustomStub))
          }
        })
      })
    })

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
          }
        ],
        shippingMethod: 'Courier',
        paymentMethod: 'Visa',
        total: 5000
      }

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Completed Transaction': 'CompletedOrder'
        })
      })

      it('should track completed transaction with default operation', () => {
        window.digitalData.user = {
          userId: 'user123'
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onCompletedTransactionCompletedOrderStub
            ))
          }
        })
      })

      it('should track completed transaction with default custom operation', () => {
        window.digitalData.user = {
          userId: 'user123'
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          integrations: {
            mindbox: {
              operation: 'CompletedOrderCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onCompletedTransactionCompletedOrderCustomStub
            ))
          }
        })
      })
    })

    describe('#onSubscribed and #onRegistered', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          Subscribed: 'EmailSubscribe',
          Registered: 'Registration',
          'Updated Profile Info': 'UpdateProfile'
        })
        mindbox.setOption('userVars', {
          email: {
            type: 'digitalData',
            value: 'user.email'
          },
          firstName: {
            type: 'digitalData',
            value: 'user.firstName'
          },
          lastName: {
            type: 'digitalData',
            value: 'user.lastName'
          },
          authenticationTicket: {
            type: 'digitalData',
            value: 'user.authenticationTicket'
          }
        })
        mindbox.prepareEnrichableUserIds()
        mindbox.prepareEnrichableUserProps()
        mindbox.prepareEnrichableAreaIds()
      })

      it('should track subscription with default operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxx'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', V2Stubs.onSubscribedSubscribedStub))
          }
        })
      })

      it('should track subscription with custom operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxx'
          },
          integrations: {
            mindbox: {
              operation: 'EmailSubscribeCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onSubscribedEmailSubscribeCustomStub
            ))
          }
        })
      })

      it('should track registration with default operation', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxx'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', V2Stubs.onRegisteredRegistrationStub))
          }
        })
      })

      it('should track registration with custom operation', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxx'
          },
          integrations: {
            mindbox: {
              operation: 'RegistrationCustom'
            }
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onRegisteredRegistrationCustomStub
            ))
          }
        })
      })

      it('should track registration with subscription to email and sms', () => {
        window.digitalData.events.push({
          name: 'Registered',
          user: {
            isSubscribed: true,
            isSubscribedBySms: true,
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxx'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onRegisteredRegistrationAndSubscriptionStub
            ))
          }
        })
      })

      it('should track update profile info with subscription to email and sms', () => {
        window.digitalData.events.push({
          name: 'Updated Profile Info',
          user: {
            isSubscribed: true,
            isSubscribedBySms: true,
            authenticationTicket: 'xxxxx',
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onRegisteredUpdateProfileSubscriptionOnStub
            ))
          }
        })
      })

      it('should track update profile info with unsubscription to email and sms', () => {
        window.digitalData.events.push({
          name: 'Updated Profile Info',
          user: {
            isSubscribed: false,
            isSubscribedBySms: false,
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'identify',
              V2Stubs.onRegisteredUpdateProfileSubscriptionOffStub
            ))
          }
        })
      })
    })

    describe('#onLoggedIn', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Logged In': 'EnterWebsite'
        })
        window.digitalData.user = {
          userId: '123'
        }
      })

      it('should track authorization with default operation', () => {
        window.digitalData.events.push({
          name: 'Logged In',
          callback: () => {
            assert.ok(window.mindbox.calledWith('identify', V2Stubs.onLoggedInLoggedInStub))
          }
        })
      })
    })
  })

  describe('after loading V3', () => {
    beforeEach((done) => {
      mindbox.setOption('apiVersion', 'V3')
      mindbox.setOption('productIdsMapping', {
        bitrixId: 'id'
      })
      mindbox.setOption('customerIdsMapping', {
        bitrixId: {
          type: 'digitalData',
          value: 'user.userId'
        }
      })
      mindbox.setOption('userVars', {
        email: {
          type: 'digitalData',
          value: 'user.email'
        },
        mobilePhone: {
          type: 'digitalData',
          value: 'user.phone'
        }
      })
      mindbox.setOption('areaIdsMapping', {
        externalId: {
          type: 'digitalData',
          value: 'website.regionId'
        }
      })
      mindbox.setOption('productSkuIdsMapping', {
        bitrixId: 'skuCode'
      })
      mindbox.setOption('productCategoryIdsMapping', {
        bitrixId: 'listing.categoryId'
      })
      mindbox.prepareEnrichableUserIds()
      mindbox.prepareEnrichableUserProps()
      mindbox.prepareEnrichableAreaIds()
      sinon.stub(mindbox, 'load').callsFake(() => {
        mindbox.onLoad()
      })
      ddManager.once('ready', done)
      ddManager.initialize()
      sinon.stub(window, 'mindbox')
    })

    afterEach(() => {
      window.mindbox.restore()
    })

    describe('#onViewedPage', () => {
      beforeEach(() => {
        mindbox.setOption('setCartOperation', 'SetCart')
      })

      it('should track cart if set cart operation defined (no customer)', () => {
        window.digitalData.cart = V3Stubs.onViewedPageCartStub
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onViewedPageSetCartUnauthorizedStub))
          }
        })
      })

      it('should track cart if set cart operation defined (authenticated customer)', () => {
        window.digitalData.user = {
          userId: 'user123'
        }
        window.digitalData.cart = V3Stubs.onViewedPageCartStub
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onViewedPageSetCartAuthorizedStub))
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Detail': 'ViewProduct'
        })
      })

      it('should track viewed product with default operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onViewedProductDetailViewProductStub))
          }
        })
      })

      it('should track viewed product with default operation and sku', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            skuCode: 'sku123'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onViewedProductDetailViewProductSkuStub
            ))
          }
        })
      })

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
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onViewedProductDetailViewedProductCustomStub
            ))
          }
        })
      })
    })

    describe('#onUpdatedCart', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Updated Cart': 'SetCart'
        })
        mindbox.setOption('productIdsMapping', {
          exampleId: 'id'
        })
        mindbox.setOption('productSkuIdsMapping', {
          exampleSku: 'skuCode'
        })
      })

      it('should update cart', () => {
        window.digitalData.events.push({
          name: 'Updated Cart',
          cart: {
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 1000,
                  skuCode: 'sku123'
                },
                quantity: 2
              },
              {
                product: {
                  id: '234',
                  unitSalePrice: 1000,
                  skuCode: 'sku234'
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onUpdateCartSetCartStub))
          }
        })
      })
    })

    describe('#onAddedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('productIdsMapping', {
          testId: 'id'
        })
        mindbox.setOption('productSkuIdsMapping', {
          testSku: 'skuCode'
        })
      })

      it('should track added product with mapped operation', () => {
        mindbox.setOption('operationMapping', {
          'Added Product': 'AddProduct'
        })
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          quantity: 5,
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onAddedProductMappedAddProductStub))
          }
        })
      })
    })

    describe('#onRemovedProduct', () => {
      beforeEach(() => {
        mindbox.setOption('productIdsMapping', {
          testId: 'id'
        })
        mindbox.setOption('productSkuIdsMapping', {
          testSku: 'skuCode'
        })
      })

      it('should track removed product with mapped operation', () => {
        mindbox.setOption('operationMapping', {
          'Removed Product': 'RemoveProduct'
        })
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: '123',
            unitSalePrice: 1000,
            skuCode: 'sku123'
          },
          quantity: 1,
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onRemovedProductMappedRemoveProductStub))
          }
        })
      })
    })

    describe('#onAddedProductToWishlist', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Added Product to Wishlist': 'AddProductToWishlist'
        })
        mindbox.setOption('productIdsMapping', {
          testId: 'id'
        })
        mindbox.setOption('productSkuIdsMapping', {
          testSku: 'skuCode'
        })
      })

      it('should track added product with mapped operation', () => {
        window.digitalData.events.push({
          name: 'Added Product to Wishlist',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onAddedProductToWishlistStub))
          }
        })
      })
    })

    describe('#onRemovedProductFromWishlist', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Removed Product from Wishlist': 'RemoveProductFromWishlist'
        })
        mindbox.setOption('productIdsMapping', {
          testId: 'id'
        })
        mindbox.setOption('productSkuIdsMapping', {
          testSku: 'skuCode'
        })
      })

      it('should track added product with mapped operation', () => {
        window.digitalData.events.push({
          name: 'Removed Product from Wishlist',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 2500
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onRemovedProductFromWishlistStub))
          }
        })
      })
    })

    describe('#onViewedProductListing', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Viewed Product Listing': 'CategoryView'
        })
      })

      it('should track viewed product listing with default operation', () => {
        window.digitalData.listing = {
          categoryId: '123'
        }
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onViewedProductListingCategoryViewStub
            ))
          }
        })
      })

      it('should track viewed product listing with custom operation', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123'
          },
          operation: 'CategoryViewCustom',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onViewedProductListingCategoryViewCustomStub
            ))
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Completed Transaction': 'CompletedOrder'
        })
        mindbox.setOption('orderVars', {
          oneMoreField: 'transaction.customField'
        })
        mindbox.setOption('orderIdsMapping', {
          bitrixId: {
            type: 'event',
            value: 'transaction.orderId'
          },
          sapId: {
            type: 'event',
            value: 'transaction.sapOrderId'
          }
        })
      })

      it('should track completed transaction with default operation', () => {
        window.digitalData.website = {
          regionId: 'region123'
        }
        window.digitalData.user = {
          userId: 'user123',
          email: 'test@driveback.ru',
          phone: '+70000000000'
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: V3Stubs.onCompletedTransactionTransactionStub,
          operation: 'CompletedOrder',
          integrations: {
            mindbox: {
              operation: 'CompletedOrder'
            }
          },
          callback: () => {
            sinon.assert.calledWith(
              window.mindbox,
              'async',
              V3Stubs.onCompletedTransactionCheckoutOperationStub
            )
          }
        })
      })

      it('should track completed transaction with default custom operation and sku', () => {
        window.digitalData.user = {
          userId: 'user123'
        }
        window.digitalData.website = {
          regionId: 'region123'
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: V3Stubs.onCompletedTransactionTransactionSkuStub,
          operation: 'CompletedOrderCustom',
          callback: () => {
            sinon.assert.calledWith(
              window.mindbox,
              'async',
              V3Stubs.onCompletedTransactionCheckoutCustomOperationStub
            )
          }
        })
      })
    })

    describe('#onSubscribed and #onRegistered and #onUpdatedProfileInfo', () => {
      const registeredUser = V3Stubs.onRegisteredUserStub

      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          Subscribed: 'EmailSubscribe',
          Registered: 'Registration',
          'Updated Profile Info': 'UpdateProfile'
        })
        mindbox.setOption('userVars', {
          email: {
            type: 'digitalData',
            value: 'user.email'
          },
          firstName: {
            type: 'digitalData',
            value: 'user.firstName'
          },
          lastName: {
            type: 'digitalData',
            value: 'user.lastName'
          },
          mobilePhone: {
            type: 'digitalData',
            value: 'user.phone'
          },
          source: {
            type: 'event',
            value: 'source'
          },
          city: {
            type: 'digitalData',
            value: 'user.city'
          },
          childrenNames: {
            type: 'digitalData',
            value: 'user.childrenNames'
          },
          b2b: {
            type: 'digitalData',
            value: 'user.b2b'
          },
          authenticationTicket: {
            type: 'digitalData',
            value: 'user.authenticationTicket'
          }
        })
        mindbox.prepareEnrichableUserIds()
        mindbox.prepareEnrichableUserProps()
        mindbox.prepareEnrichableAreaIds()
      })

      it('should track subscription with default operation', () => {
        window.digitalData.website = {
          regionId: 'region123'
        }
        window.digitalData.events.push({
          name: 'Subscribed',
          source: 'Driveback',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxxxx'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onSubscribedEmailSubscribeStub))
          }
        })
      })

      it('should track subscription with custom operation', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          operation: 'EmailSubscribeCustom',
          source: 'Driveback',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            authenticationTicket: 'xxxxx'
          },
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onSubscribedEmailSubscribeCustomStub))
          }
        })
      })

      it('should track subscription with custom operation and multiple subscriptions', () => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John',
            lastName: 'Dow',
            phone: '111111111',
            authenticationTicket: 'xxxxx'
          },
          subscriptions: [
            {
              type: 'email',
              topic: 'News'
            },
            {
              type: 'email',
              topic: 'Special Offers'
            },
            {
              type: 'sms',
              topic: 'Special Offers'
            }
          ],
          campaign: {
            id: '123123',
            name: 'Footer Form'
          },
          operation: 'EmailSubscribeCustom',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onSubscribedEmailSubscribeAlterCustomStub
            ))
          }
        })
      })

      it('should track registration with default operation', () => {
        window.digitalData.user = registeredUser
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onRegisteredRegistrationStub))
          }
        })
      })

      it('should track registration with custom operation', () => {
        window.digitalData.user = registeredUser
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          operation: 'RegistrationCustom',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onRegisteredRegistrationCustomStub))
          }
        })
      })

      it('should track registration with subscription to email and sms', () => {
        window.digitalData.user = {
          ...registeredUser,
          isSubscribed: true,
          isSubscribedBySms: true
        }
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onRegisteredRegistrationWithSubscriptionStub
            ))
          }
        })
      })

      it('should track Registered with mass subscriptions', () => {
        window.digitalData.user = {
          ...registeredUser,
          subscriptions: [
            {
              type: 'email',
              topic: 'News',
              isSubscribed: true
            },
            {
              type: 'email',
              topic: 'Offers',
              isSubscribed: true
            },
            {
              type: 'sms',
              isSubscribed: true
            }
          ]
        }
        window.digitalData.events.push({
          name: 'Registered',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith(
              'async',
              V3Stubs.onRegisteredRegistrationWithMassSubscriptionsStub
            ))
          }
        })
      })

      it('should track Updated Profile Info with mass subscriptions', () => {
        window.digitalData.user = {
          ...registeredUser,
          subscriptions: V3Stubs.onUpdatedProfileInfoSubscriptionsStub
        }
        window.digitalData.events.push({
          name: 'Updated Profile Info',
          source: 'Driveback',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onUpdatedProfileInfoStub))
          }
        })
      })
      // end onSubscribed and onRegistered tests
    })

    describe('#onLoggedIn', () => {
      beforeEach(() => {
        mindbox.setOption('operationMapping', {
          'Logged In': 'EnterWebsite'
        })
        mindbox.setOption('userVars', {
          email: {
            type: 'digitalData',
            value: 'user.email'
          },
          mobilePhone: {
            type: 'digitalData',
            value: 'user.phone'
          }
        })
        window.digitalData.user = {
          userId: 'user123',
          email: 'test@driveback.ru',
          phone: '74957777777'
        }
        mindbox.prepareEnrichableUserIds()
        mindbox.prepareEnrichableUserProps()
        mindbox.prepareEnrichableAreaIds()
      })

      it('should track authorization with default operation', () => {
        window.digitalData.events.push({
          name: 'Logged In',
          callback: () => {
            assert.ok(window.mindbox.calledWith('async', V3Stubs.onLoggedInEnterWebsiteStub))
          }
        })
      })
    })
  })
})
