import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import after from './../../src/functions/after.js';
import argumentsToArray from './../functions/argumentsToArray.js';
import GoogleAnalytics from './../../src/integrations/GoogleAnalytics.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: GoogleAnalytics', () => {

  describe('Universal', () => {
    let ga;
    let options = {
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'auto',
      siteSpeedSampleRate: 42,
      namespace: false
    };

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('before loading', function () {
      beforeEach(function () {
        sinon.stub(ga, 'load');
      });

      afterEach(function () {
        ga.load.restore();
      });

      describe('#initialize', function () {
        it('should require \'displayfeatures\' if .doubleClick option is `true`', function () {
          ga.setOption('doubleClick', true);
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['require', 'displayfeatures']);
        });

        it('should require "linkid.js" if enhanced link attribution is `true`', function () {
          ga.setOption('enhancedLinkAttribution', true);
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['require', 'linkid', 'linkid.js']);
        });

        it('should create window.GoogleAnalyticsObject', function () {
          assert.ok(!window.GoogleAnalyticsObject);
          ddManager.initialize({
            autoEvents: false
          });
          assert.equal(window.GoogleAnalyticsObject, 'ga');
        });

        it('should create window.ga', function () {
          assert.ok(!window.ga);
          ddManager.initialize({
            autoEvents: false
          });
          assert.equal(typeof window.ga, 'function');
        });

        it('should create window.ga.l', function () {
          assert.ok(!window.ga);
          ddManager.initialize({
            autoEvents: false
          });
          assert.equal(typeof window.ga.l, 'number');
        });

        it('should call window.ga.create with options', function () {
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(argumentsToArray(window.ga.q[0]), ['create', options.trackingId, {
            cookieDomain: 'none',
            siteSpeedSampleRate: options.siteSpeedSampleRate,
            allowLinker: true,
            name: undefined
          }]);
        });

        it('should anonymize the ip', function () {
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['set', 'anonymizeIp', true]);
        });

        it('should call #load', function () {
          ddManager.initialize({
            autoEvents: false
          });
          assert.ok(ga.load.calledOnce);
        });

        it('should not send universal user id by default', function () {
          window.digitalData.user = {
            id: 'baz'
          };
          ddManager.initialize({
            autoEvents: false
          });
          assert.notDeepEqual(argumentsToArray(window.ga.q[1]), ['set', 'userId', 'baz']);
        });

        it('should send universal user id if sendUserId option is true and user.id is truthy', function () {
          window.digitalData.user = {
            id: 'baz'
          };
          ga.setOption('sendUserId', true);
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['set', 'userId', 'baz']);
        });

        it('should map custom dimensions & metrics using DDL data', function() {
          ga.setOption('metrics', {
            metric1: 'user.firstName',
            metric2: 'user.lastName',
            metric3: 'user.isSubscribed'
          });
          ga.setOption('dimensions', {
            dimension2: 'user.age',
            dimension3: 'user.hasTransacted'
          });
          window.digitalData.user = {
            firstName: 'John',
            lastName: 'Doe',
            age: 20,
            isSubscribed: true,
            hasTransacted: false
          };
          ddManager.initialize({
            autoEvents: false
          });

          assert.deepEqual(argumentsToArray(window.ga.q[2]), ['set', {
            metric1: 'John',
            metric2: 'Doe',
            metric3: 'true',
            dimension2: 20,
            dimension3: 'false'
          }]);
        });

        it('should not set metrics, dimensions & content groupings if there is no data in DDL', function() {
          ga.setOption('metrics', {
            metric1: 'something'
          });
          ga.setOption('dimensions', {
            dimension3: 'industry'
          });
          ga.setOption('contentGroupings', {
            contentGrouping1: 'foo'
          });
          ddManager.initialize({
            autoEvents: false
          });
          assert.deepEqual(window.ga.q[2], undefined);
        });
      });

    });

    describe('loading', function () {
      it('should load', function (done) {
        assert.ok(!ga.isLoaded());
        ddManager.once('ready', () => {
          assert.ok(ga.isLoaded());
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
        ddManager.initialize({
          autoEvents: false
        });
      });

      describe('#page', () => {
        beforeEach(() => {
          sinon.stub(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should send a page view', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'pageview', {
                page: window.location.pathname,
                title: document.title,
                location: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
              }));
              done();
            }
          });
        });

        it('should omit location on subsequent page views', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'pageview', {
                page: window.location.pathname,
                title: document.title,
                location: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
              }));

              window.digitalData.events.push({
                name: 'Viewed Page',
                page: {},
                callback: () => {
                  assert.ok(window.ga.calledWith('send', 'pageview', {
                    page: window.location.pathname,
                    title: document.title
                  }));
                  done();
                }
              });
            }
          });
        });

        it('should set the tracker\'s page object', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: () => {
              window.ga.calledWith('set', {
                page: window.location.pathname,
                title: document.title
              });
              done();
            }
          });
        });

        it('should send a page view with properties', (done) => {
          digitalData.events.push({
            name: 'Viewed Page',
            page: {
              path: '/path',
              name: 'page name',
              url: 'url'
            },
            callback: () => {
              window.ga.calledWith('send', 'pageview', {
                page: '/path',
                title: 'page name',
                location: 'url'
              });
              done();
            }
          });
        });

        it('should send the query if its included', (done) => {
          ga.setOption('includeSearch', true);
          digitalData.events.push({
            name: 'Viewed Page',
            page: {
              name: 'page name',
              path: '/path',
              queryString: '?q=1',
              url: 'url'
            },
            callback: () => {
              window.ga.calledWith('send', 'pageview', {
                page: '/path?q=1',
                title: 'page name',
                location: 'url'
              });
              done();
            }
          });
        });

        it('should map custom dimensions, metrics & cuntent groupings using event properties', (done) => {
          ga.setOption('metrics', {
            metric1: 'page.score'
          });
          ga.setOption('dimensions', {
            dimension1: 'page.author',
            dimension2: 'page.postType'
          });
          ga.setOption('contentGroupings', {
            contentGrouping1: 'page.section'
          });
          window.digitalData.events.push({
            name: 'Custom Event',
            page: {
              score: 21,
              author: 'Author',
              postType: 'blog',
              section: 'News'
            },
            callback: () => {
              assert.ok(window.ga.calledWith('set', {
                metric1: 21,
                dimension1: 'Author',
                dimension2: 'blog',
                contentGrouping1: 'News'
              }));
              done();
            }
          });
        });

      });

      describe('#track', function () {
        beforeEach(function () {
          sinon.stub(window, 'ga');
        });

        it('should send an event', function () {
          window.digitalData.events.push({
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a category property', function () {
          window.digitalData.events.push({
            category: 'category',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'category',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a label property', function () {
          window.digitalData.events.push({
            name: "event",
            label: 'label',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: 'label',
                eventValue: 0,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a rounded value property', function () {
          window.digitalData.events.push({
            value: 1.1,
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 1,
                nonInteraction: false
              }));
            }
          });
        });

        it('should send a non-interaction property', function () {
          window.digitalData.events.push({
            nonInteraction: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: undefined,
                eventValue: 0,
                nonInteraction: true
              }));
            }
          });
        });

        it('should map custom dimensions & metrics', function() {
          ga.setOption('metrics', {
            metric1: 'loadTime',
            metric2: 'levelAchieved'
          });
          ga.setOption('dimensions', {
            dimension2: 'referrer'
          });

          window.digitalData.events.push({
            name: 'Level Unlocked',
            loadTime: '100',
            levelAchieved: '5',
            referrer: 'Google',
            callback: () => {
              assert.ok(window.ga.calledWith('set', {
                metric1: '100',
                metric2: '5',
                dimension2: 'Google'
              }));
            }
          });
        });
      });

      describe('ecommerce', function () {

        beforeEach(function () {
          sinon.stub(window, 'ga');
        });

        it('should require ecommerce.js', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'e213e4da'
            },
            callback: () => {
              assert.ok(window.ga.calledWith('require', 'ecommerce'));
            }
          });
        });

        it('should send simple ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: () => {
              assert.ok(window.ga.args.length === 3);
              assert.ok(window.ga.args[1][0] === 'ecommerce:addTransaction');
              assert.ok(window.ga.args[2][0] === 'ecommerce:send');
            }
          });
        });

        it('should send ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.99,
              shippingCost: 13.99,
              tax: 20.99,
              currency: 'USD',
              lineItems: [
                {
                  product: {
                    unitPrice: 24.75,
                    unitSalePrice: 24.75,
                    name: 'my product',
                    skuCode: 'p-298'
                  },
                  quantity: 1
                },
                {
                  product: {
                    unitPrice: 24.75,
                    unitSalePrice: 24.75,
                    name: 'other product',
                    skuCode: 'p-299'
                  },
                  quantity: 3
                }
              ]
            },
            callback: () => {
              assert.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                id: '780bc55',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.99,
                currency: 'USD'
              }]);

              assert.deepEqual(window.ga.args[2], ['ecommerce:addItem', {
                id: '780bc55',
                category: undefined,
                name: 'my product',
                price: 24.75,
                quantity: 1,
                sku: 'p-298',
                currency: 'USD'
              }]);

              assert.deepEqual(window.ga.args[3], ['ecommerce:addItem', {
                id: '780bc55',
                category: undefined,
                name: 'other product',
                price: 24.75,
                sku: 'p-299',
                quantity: 3,
                currency: 'USD'
              }]);

              assert.deepEqual(window.ga.args[4], ['ecommerce:send']);
            }
          });
        });

        it('should fallback to revenue', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              shippingCost: 13.99,
              tax: 20.99,
              total: 99.9,
              currency: 'USD',
              lineItems: []
            },
            callback: () => {
              assert.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                id: '5d4c7cb5',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.9,
                currency: 'USD'
              }]);
            }
          });
        });

        it('should pass custom currency', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              total: 99.9,
              shippingCost: 13.99,
              tax: 20.99,
              currency: 'EUR',
              lineItems: [],
              callback: () => {
                assert.deepEqual(window.ga.args[1], ['ecommerce:addTransaction', {
                  id: '5d4c7cb5',
                  revenue: 99.9,
                  shipping: 13.99,
                  affiliation: undefined,
                  tax: 20.99,
                  currency: 'EUR'
                }]);
              }
            }
          });
        });
      });

    });
  });

  describe('Universal Enhanced Ecommerce', function() {
    let ga;
    let options = {
      enhancedEcommerce: true,
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: false
    };

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('after loading', function() {
      beforeEach((done) => {
        ddManager.once('ready', done);
        ddManager.initialize({
          autoEvents: false
        });
      });

      describe('enhanced ecommerce', function() {
        beforeEach(function() {
          sinon.stub(window, 'ga');
        });

        it('should require ec.js', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: () => {
              assert.ok(window.ga.args.length > 0);
              assert.deepEqual(argumentsToArray(window.ga.args[0]), ['require', 'ec']);
            }
          });
        });

        it('should not require ec if .enhancedEcommerceLoaded is true', function() {
          ga.enhancedEcommerceLoaded = true;
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: () => {
              assert.ok(window.ga.args.length > 0);
              assert.notDeepEqual(argumentsToArray(window.ga.args[0]), ['require', 'ec']);
            }
          });
        });

        it('should set currency for ec.js to default', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7'
            },
            callback: () => {
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
            }
          });
        });

        it('should set currency for ec.js to custom currency', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'ee099bf7',
              currency: 'EUR'
            },
            callback: () => {
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'EUR']);
            }
          });
        });

        it('should send added product data', function() {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: () => {
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send added product data from digital data layer', function() {
          window.digitalData.product = {
            id: 'p-298',
            currency: 'CAD',
            unitPrice: 24.75,
            name: 'my product',
            category: 'cat 1',
            skuCode: 'p-298'
          };
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: 'p-298',
            quantity: 1,
            callback: () => {
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send send label tracking enhanced ecommerce events with Univeral Analytics', function() {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            label: 'sample label',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'add', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Added Product', 'sample label', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send removed product data', function() {
          window.digitalData.events.push({
            name: 'Removed Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            quantity: 1,
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'remove', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Removed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data', function() {
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298'
            },
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                quantity: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'detail', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked product data', function() {
          window.digitalData.events.push({
            name: 'Clicked Product',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              listName: 'search results'
            },
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                quantity: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'click', {
                list: 'search results'
              }]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked product data with data from DDL', function() {
          window.digitalData.listing = {
            listName: 'search results',
            items: [
              {
                id: 'p-298',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Clicked Product',
            product: 'p-298',
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                quantity: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'click', {
                list: 'search results'
              }]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data', function() {
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            product: {
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              listName: 'search results',
              position: 2
            },
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }]);
              assert.deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data array', function() {
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            product: [
              {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
                listName: 'search results',
                position: 2
              },
              {
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-299',
                listName: 'search results',
                position: 2
              }
            ],
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[4]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }]);
              assert.deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data from DDL', function() {
          window.digitalData.listing = {
            listName: 'search results',
            items: [
              {
                id: 'p-298',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
              },
              {
                id: 'p-299',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my other product',
                category: 'cat 1',
                skuCode: 'p-298',
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            product: 'p-299',
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }]);
              assert.deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed product data from DDL', function() {
          window.digitalData.listing = {
            listName: 'search results',
            items: [
              {
                id: 'p-298',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
              },
              {
                id: 'p-299',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my other product',
                category: 'cat 1',
                skuCode: 'p-299',
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            product: ['p-298', 'p-299'],
            listName: 'search results',
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 1,
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[4]), ['ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'search results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }]);
              assert.deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data', function() {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            },
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(window.ga.args[3], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data array', function() {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: [
              {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                design: 'summer_banner2',
                position: 'banner_slot1'
              },
              {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                design: 'summer_banner2',
                position: 'banner_slot1'
              }
            ],
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data from DDL', function() {
          window.digitalData.campaigns = [{
            id: 'PROMO_1234',
            name: 'Summer Sale',
            design: 'summer_banner2',
            position: 'banner_slot1'
          }];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: 'PROMO_1234',
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(window.ga.args[3], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send viewed promotion data from DDL', function() {
          window.digitalData.campaigns = [
            {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            },
            {
              id: 'PROMO_2345',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            }
          ];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: ['PROMO_1234', 'PROMO_2345'],
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send clicked promotion data', function() {
          window.digitalData.events.push({
            name: 'Clicked Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1'
            },
            callback: () => {
              assert.equal(window.ga.args.length, 5);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'USD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1'
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:setAction', 'promo_click', {}]);
              assert.deepEqual(window.ga.args[4], ['send', 'event', 'Promo', 'Clicked Campaign', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send started order data', function() {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [
              {
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  skuCode: 'p-298'
                },
                quantity: 1
              },
              {
                product: {
                  id: 'p-299',
                  unitPrice: 24.75,
                  name: 'other product',
                  skuCode: 'p-299'
                },
                quantity: 3
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Viewed Checkout Step',
            step: 1,
            paymentMethod: 'Visa',
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: undefined,
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: undefined,
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[4]), ['ec:setAction', 'checkout', {
                step: 1,
                option: 'Visa'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Viewed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed checkout step data', function() {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [
              {
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  skuCode: 'p-298'
                },
                quantity: 1
              },
              {
                product: {
                  id: 'p-299',
                  unitPrice: 24.75,
                  name: 'other product',
                  skuCode: 'p-299'
                },
                quantity: 3
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            shippingMethod: 'FedEx',
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:setAction', 'checkout_option', {
                step: 2,
                option: 'FedEx'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed checkout step data with all options', function() {
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [
              {
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  skuCode: 'p-298'
                },
                quantity: 1
              },
              {
                product: {
                  id: 'p-299',
                  unitPrice: 24.75,
                  name: 'other product',
                  skuCode: 'p-299'
                },
                quantity: 3
              }
            ]
          };
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            paymentMethod: 'Visa',
            shippingMethod: 'FedEx',
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:setAction', 'checkout_option', {
                step: 2,
                option: 'Visa, FedEx'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: 1 }]);
            }
          });
        });

        it('should not send completed checkout step data without a step', function() {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            paymentMethod: 'Visa',
            callback: () => {
              assert.equal(window.ga.args.length, 0);
            }
          });
        });

        it('should not send completed checkout step data without an option', function() {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            callback: () => {
              assert.equal(window.ga.args.length, 0);
            }
          });
        });

        it('should send simple completed order data', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:setAction', 'purchase', {
                id: '7306cc06',
                affiliation: undefined,
                revenue: 0.0,
                tax: undefined,
                shipping: undefined,
                coupon: undefined
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send completed order data', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              vouchers: ['coupon'],
              affiliation: 'affiliation',
              lineItems: [
                {
                  product: {
                    id: 'p-298',
                    unitPrice: 24.75,
                    name: 'my product',
                    category: 'cat 1',
                    skuCode: 'p-298'
                  },
                  quantity: 1
                },
                {
                  product: {
                    unitSalePrice: 24.75,
                    name: 'other product',
                    category: 'cat 2',
                    skuCode: 'p-299',
                    currency: 'EUR'
                  },
                  quantity: 3
                }
              ]

            },
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[4]), ['ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should add coupon to product level in completed order', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              vouchers: ['coupon'],
              affiliation: 'affiliation',
              lineItems: [
                {
                  product: {
                    id: 'p-298',
                    unitPrice: 24.75,
                    name: 'my product',
                    category: 'cat 1',
                    skuCode: 'p-298',
                    voucher: 'promo'
                  },
                  quantity: 1
                },
                {
                  product: {
                    unitSalePrice: 24.75,
                    name: 'other product',
                    category: 'cat 2',
                    skuCode: 'p-299',
                    currency: 'EUR'
                  },
                  quantity: 3
                }
              ]

            },
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(argumentsToArray(window.ga.args[1]), ['set', '&cu', 'CAD']);
              assert.deepEqual(argumentsToArray(window.ga.args[2]), ['ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                coupon: 'promo',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[3]), ['ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR',
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[4]), ['ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon'
              }]);
              assert.deepEqual(argumentsToArray(window.ga.args[5]), ['send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('completed order should fallback to revenue', function() {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: []
            },
            callback: () => {
              assert.deepEqual(window.ga.args[2], ['ec:setAction', 'purchase', {
                id: '5d4c7cb5',
                affiliation: undefined,
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: undefined
              }]);
            }
          });
        });

        it('should send full refunded order data', function() {
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: []
            },
            callback: () => {
              assert.equal(window.ga.args.length, 4);
              assert.deepEqual(window.ga.args[2], ['ec:setAction', 'refund', {
                id: '780bc55'
              }]);
              assert.deepEqual(window.ga.args[3], ['send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: 1 }]);
            }
          });
        });

        it('should send partial refunded order data', function() {
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: [
                {
                  product: {
                    skuCode: 'p-298'
                  },
                  quanity: 1
                },
                {
                  product: {
                    skuCode: 'p-299'
                  },
                  quantity: 2
                }
              ]
            },
            callback: () => {
              assert.equal(window.ga.args.length, 6);
              assert.deepEqual(window.ga.args[2], ['ec:addProduct', {
                id: 'p-298',
                name: undefined,
                category: undefined,
                quantity: undefined,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              assert.deepEqual(window.ga.args[3], ['ec:addProduct', {
                id: 'p-299',
                name: undefined,
                category: undefined,
                quantity: 2,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD'
              }]);
              assert.deepEqual(window.ga.args[4], ['ec:setAction', 'refund', {
                id: '780bc55'
              }]);
              assert.deepEqual(window.ga.args[5], ['send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: 1 }]);
            }
          });
        });
      });
    });
  });

  describe('Universal with noConflict', function() {

    let ga;
    let options = {
      trackingId: 'UA-51485228-7',
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: 'ddl',
      noConflict: true
    };

    function loadGA(callback) {
      //load GA
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      window.ga('create', 'UA-51485228-7', {
        // Fall back on default to protect against empty string
        cookieDomain: 'auto',
        name: 'gtm.123',
      });
      window.ga('send', 'pageview');

      window.ga(() => {
        callback();
      });
    }

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('after loading', function () {
      beforeEach((done) => {
        loadGA(() => {
          ddManager.once('ready', done);
          ddManager.initialize({
            autoEvents: false
          });
        });
      });

      describe('enhanced ecommerce', function () {

        beforeEach(() => {
          sinon.spy(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should use custom namespace in requests', (done) => {
          window.digitalData.events.push({
            name: 'Test',
            category: 'Test',
            callback: () => {
              assert.equal(2, window.ga.getAll().length);
              assert.ok(window.ga.calledOnce);
              done();
            }
          });
        });

        it('should not track View Page semantic event', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            category: 'Content',
            callback: () => {
              assert.ok(!window.ga.called);
              done();
            }
          });
        });

        it('should not track simple ecommerce data', function () {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: () => {
              assert.equal(window.ga.args.length, 1);
            }
          });
        });

      });
    });
  });

  describe('Universal with filterEvents', function() {

    let ga;
    let options = {
      enhancedEcommerce: true,
      trackingId: 'UA-51485228-7',
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: 'ddl',
      filterEvents: ['Completed Transaction']
    };

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('after loading', function () {
      beforeEach((done) => {
        ddManager.once('ready', done);
        ddManager.initialize({
          autoEvents: false
        });
      });

      describe('enhanced ecommerce', function () {

        beforeEach(() => {
          sinon.spy(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should not track View Page semantic event', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            category: 'Content',
            callback: () => {
              assert.ok(!window.ga.called);
              done();
            }
          });
        });

        it('should not track simple ecommerce data', function (done) {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06'
            },
            callback: () => {
              assert.ok(!window.ga.called);
              done();
            }
          });
        });

      });
    });
  });

});