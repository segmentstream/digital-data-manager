import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset';
import GoogleAdWords from './../../src/integrations/GoogleAdWords';
import ddManager from './../../src/ddManager';

// Google AdWords doesn't have stubs for async loading
// so we emulate async queue in integration and wait
// until scripts are loaded using setInterval
function asyncCallback(callback) {
  return () => {
    ddManager.on('ready', () => {
      setTimeout(() => {
        callback();
      }, 101);
    });
  };
}

function viewedPage(callback, page = {}) {
  window.digitalData.events.push({
    name: 'Viewed Page',
    category: 'Content',
    page,
    callback: asyncCallback(callback),
  });
}

function viewedPageOfType(type, callback) {
  viewedPage(callback, { type });
}

function viewedProductCategory(category, callback) {
  const event = {
    name: 'Viewed Product Category',
    callback: asyncCallback(callback),
  };
  if (category) {
    event.listing = { category };
  }
  window.digitalData.events.push(event);
}

function viewedSearchResults(query, callback) {
  const event = {
    name: 'Searched Products',
    callback: asyncCallback(callback),
  };
  if (query) {
    event.listing = { query };
  }
  window.digitalData.events.push(event);
}

function viewedProductDetail(product, callback) {
  window.digitalData.events.push({
    name: 'Viewed Product Detail',
    product: product,
    callback: asyncCallback(callback),
  });
}

function completedTransaction(transaction, callback) {
  window.digitalData.events.push({
    name: 'Completed Transaction',
    transaction,
    callback: asyncCallback(callback),
  });
}

function viewedCart(cart, callback) {
  window.digitalData.events.push({
    name: 'Viewed Cart',
    category: 'Ecommerce',
    cart,
    callback: asyncCallback(callback),
  });
}

describe('Integrations: GoogleAdWords', () => {

  let adwords;
  const options = {
    conversionId: '123',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    adwords = new GoogleAdWords(window.digitalData, options);
    ddManager.addIntegration('Google AdWords', adwords);
  });

  afterEach(() => {
    adwords.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(adwords, 'load');
    });

    afterEach(function () {
      adwords.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.conversionId, adwords.getOption('conversionId'));
        assert.equal('script', adwords.getTag().type);
        assert.equal(adwords.getTag().attr.src, '//www.googleadservices.com/pagead/conversion_async.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize AdWords queue object', () => {
        ddManager.initialize();
        assert.ok(adwords.asyncQueue);
        assert.ok(adwords.asyncQueue.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(adwords.load.calledOnce);
      });
    });
  });

  describe('loading', () => {
    it('should load', (done) => {
      assert.ok(!adwords.isLoaded());
      adwords.once('load', () => {
        assert.ok(adwords.isLoaded());
        done();
      });
      ddManager.initialize();
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done);
      adwords.once('load', () => {
        sinon.spy(window, 'google_trackConversion');
      });
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(() => {
      window.google_trackConversion.restore();
    });

    describe('#onViewedPage', () => {
      it('should track conversion for home page', (done) => {
        viewedPageOfType('home', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'home',
              ecomm_totalvalue: '',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should track conversion for home page (digitalData)', (done) => {
        window.digitalData.page.type = 'home';
        viewedPage(() => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'home',
              ecomm_totalvalue: '',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should track conversion for content page', (done) => {
        viewedPageOfType('content', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'other',
              ecomm_totalvalue: '',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should track conversion for any other page', (done) => {
        viewedPageOfType('login', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'other',
              ecomm_totalvalue: '',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });
    });

    describe('#onViewedProductListing', () => {
      it('should send category with default separator', (done) => {
        viewedPageOfType('listing', () => {});
        viewedProductCategory(['Category', 'Subcategory 1', 'Subcategory 2'], () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'category',
              ecomm_totalvalue: '',
              ecomm_category: 'Category/Subcategory 1/Subcategory 2',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send category with default separator (digitalData)', (done) => {
        window.digitalData.listing = {
          category: ['Category', 'Subcategory 1', 'Subcategory 2']
        };
        viewedPageOfType('listing', () => {});
        viewedProductCategory(undefined, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'category',
              ecomm_totalvalue: '',
              ecomm_category: 'Category/Subcategory 1/Subcategory 2',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send "category" without separator', (done) => {
        viewedPageOfType('listing', () => {});
        viewedProductCategory('Category 1', () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'category',
              ecomm_totalvalue: '',
              ecomm_category: 'Category 1'
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should track conversion for search page', (done) => {
        viewedPageOfType('search', () => {});
        viewedSearchResults('test query', () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'searchresults',
              ecomm_totalvalue: ''
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

    });

    describe('#onViewedProductDetail', () => {

      it('should send product id, value and category', (done) => {
        viewedPageOfType('product', () => {});
        viewedProductDetail({
          id: '123',
          unitSalePrice: 100,
          category: ['Category', 'Subcategory']
        }, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send product id, value and category (digitalData)', (done) => {
        window.digitalData.product = {
          id: '123',
          unitSalePrice: 100,
          category: ['Category', 'Subcategory']
        };
        viewedPageOfType('product', () => {});
        viewedProductDetail(undefined, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send product skuCode, value and category (digitalData)', (done) => {
        adwords.setOption('feedWithGroupedProducts', true);
        window.digitalData.product = {
          id: '123',
          skuCode: 'sku123',
          unitSalePrice: 100,
          category: ['Category', 'Subcategory']
        };
        viewedPageOfType('product', () => {});
        viewedProductDetail(undefined, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: 'sku123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send product id, value and category for legacy DDL', (done) => {
        viewedPageOfType('product', () => {});
        viewedProductDetail({
          id: '123',
          unitSalePrice: 100,
          category: 'Category',
          subcategory: 'Subcategory'
        }, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });
    });

    describe('#onViewedCart', () => {
      const cart = {
        lineItems: [
          {
            product: {
              id: '123',
              skuCode: 'sku123',
              unitSalePrice: 100
            },
            quantity: 2,
            subtotal: 180
          },
          {
            product: {
              id: '234',
              skuCode: 'sku234',
              unitSalePrice: 100
            },
            quantity: 2
          }
        ],
        subtotal: 300
      };

      it('should send product ids, value and pagetype', (done) => {
        viewedPageOfType('cart', () => {});
        viewedCart(cart , () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'cart',
            },
            google_remarketing_only: true,
          }));
          done();
        })
      });

      it('should send product ids, value and pagetype (digitalData)', (done) => {
        window.digitalData.cart = cart;
        viewedPageOfType('cart', () => {});
        viewedCart(undefined , () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'cart',
            },
            google_remarketing_only: true,
          }));
          done();
        })
      });

      it('should send product sdkIds, value and pagetype (digitalData)', (done) => {
        adwords.setOption('feedWithGroupedProducts', true);
        window.digitalData.cart = cart;
        viewedPageOfType('cart', () => {});
        viewedCart(undefined , () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['sku123', 'sku234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'cart',
            },
            google_remarketing_only: true,
          }));
          done();
        })
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
            quantity: 2,
            subtotal: 180
          },
          {
            product: {
              id: '234',
              skuCode: 'sku234',
              unitSalePrice: 100
            },
            quantity: 2
          }
        ],
        subtotal: 300
      };

      it('should send product ids, value and pagetype', (done) => {
        viewedPageOfType('confirmation', () => {});
        completedTransaction(transaction, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'purchase',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send product ids, value and pagetype (digitalData)', (done) => {
        window.digitalData.transaction = transaction;
        viewedPageOfType('confirmation', () => {});
        completedTransaction(undefined, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'purchase',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });

      it('should send product ids, value and pagetype (digitalData)', (done) => {
        adwords.setOption('feedWithGroupedProducts', true)
        window.digitalData.transaction = transaction;
        viewedPageOfType('confirmation', () => {});
        completedTransaction(undefined, () => {
          assert.ok(window.google_trackConversion.calledOnce);
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['sku123', 'sku234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'purchase',
            },
            google_remarketing_only: true,
          }));
          done();
        });
      });
    });
  });
});
