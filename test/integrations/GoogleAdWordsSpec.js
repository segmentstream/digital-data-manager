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
    ddManager.on('load', () => {
      setTimeout(() => {
        callback()
      }, 101);
    });
  }
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
  window.digitalData.events.push({
    name: 'Viewed Product Category',
    category: 'Ecommerce',
    listing: { category },
    callback: asyncCallback(callback),
  });
}

function searched(query, callback) {
  window.digitalData.events.push({
    name: 'Searched Products',
    category: 'Content',
    listing: { query },
    callback: asyncCallback(callback),
  });
}

function viewedProductDetail(product, callback) {
  window.digitalData.events.push({
    name: 'Viewed Product Detail',
    category: 'Ecommerce',
    product: product,
    callback: asyncCallback(callback),
  });
}

function completedTransaction(transaction, callback) {
  window.digitalData.events.push({
    name: 'Completed Transaction',
    category: 'Ecommerce',
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
        ddManager.initialize({
          autoEvents: false
        });
        assert.ok(adwords.asyncQueue);
        assert.ok(adwords.asyncQueue.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize({
          autoEvents: false
        });
        assert.ok(adwords.load.calledOnce);
      });
    });
  });

  describe('loading', function () {

    it('should load', function (done) {
      assert.ok(!adwords.isLoaded());
      ddManager.once('load', () => {
        assert.ok(adwords.isLoaded());
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done);
      ddManager.once('load', () => {
        sinon.spy(window, 'google_trackConversion');
      })
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(() => {
      window.google_trackConversion.restore();
    });

    describe('#onViewedPage', () => {

      it('should not track conversion for page.type = product', (done) => {
        viewedPageOfType('product', () => {
          assert.ok(!window.google_trackConversion.called);
          done();
        });
      });

      it('should not track conversion for page.type = category', (done) => {
        viewedPageOfType('category', () => {
          assert.ok(!window.google_trackConversion.called);
          done();
        });
      });

      it('should not track conversion for page.type = confirmation', (done) => {
        viewedPageOfType('confirmation', () => {
          assert.ok(!window.google_trackConversion.called);
          done();
        });
      });

      it('should track conversion for home page', (done) => {
        viewedPageOfType('home', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'home',
              ecomm_totalvalue: ''
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });

      it('should track conversion for search page', (done) => {
        viewedPageOfType('search', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'searchresults',
              ecomm_totalvalue: ''
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
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
              ecomm_totalvalue: ''
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
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
              ecomm_totalvalue: ''
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });
    });

    describe('#onViewedProductCategory', () => {
      it('should send category with default separator', (done) => {
        viewedProductCategory(['Category', 'Subcategory 1', 'Subcategory 2'], () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'category',
              ecomm_totalvalue: '',
              ecomm_category: 'Category/Subcategory 1/Subcategory 2',
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });

      it('should send "category" without separator', (done) => {
        viewedProductCategory('Category 1', () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '',
              ecomm_pagetype: 'category',
              ecomm_totalvalue: '',
              ecomm_category: 'Category 1'
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });
    });

    describe('#onViewedProductDetail', () => {
      it('should send product id, value and category', (done) => {
        viewedProductDetail({
          id: '123',
          unitSalePrice: 100,
          category: ['Category', 'Subcategory']
        }, () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });

      it('should send product id, value and category for legacy DDL', (done) => {
        viewedProductDetail({
          id: '123',
          unitSalePrice: 100,
          category: 'Category',
          subcategory: 'Subcategory'
        }, () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: '123',
              ecomm_totalvalue: 100,
              ecomm_pagetype: 'product',
              ecomm_category: 'Category/Subcategory'
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        });
      });
    });

    describe('#onViewedCart', () => {
      it('should send product ids, value and pagetype', (done) => {
        viewedCart({
          lineItems: [
            {
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 2,
              subtotal: 180
            },
            {
              product: {
                id: '234',
                unitSalePrice: 100
              },
              quantity: 2
            }
          ],
          subtotal: 300
        }, () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'cart',
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        })
      });
    });

    describe('#onCompletedTransaction', () => {
      it('should send product ids, value and pagetype', (done) => {
        completedTransaction({
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 2,
              subtotal: 180
            },
            {
              product: {
                id: '234',
                unitSalePrice: 100
              },
              quantity: 2
            }
          ],
          subtotal: 300
        }, () => {
          assert.ok(window.google_trackConversion.calledWith({
            google_conversion_id: adwords.getOption('conversionId'),
            google_custom_params: {
              ecomm_prodid: ['123', '234'],
              ecomm_totalvalue: 300,
              ecomm_pagetype: 'purchase',
            },
            google_remarketing_only: adwords.getOption('remarketingOnly'),
          }));
          done();
        })
      });
    });

  });
});
