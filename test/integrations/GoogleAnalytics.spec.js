import assert from 'assert';
import sinon from 'sinon';
import cleanObject from 'driveback-utils/cleanObject';
import htmlGlobals from 'driveback-utils/htmlGlobals';
import reset from '../reset';
import argumentsToArray from '../functions/argumentsToArray';
import GoogleAnalytics from '../../src/integrations/GoogleAnalytics';
import ddManager from '../../src/ddManager';

describe('Integrations: GoogleAnalytics', () => {
  // TODO move _document & _location to a separate stub module
  const _document = {
    referrer: 'https://google.com',
    title: 'Example home page',
  };

  const _location = {
    protocol: 'https:',
    hostname: 'example.com',
    port: '',
    pathname: '/home',
    href: 'https://example.com/home?utm_source=newsletter&utm_medium=email&utm_campaign=test_campaign',
    search: '?utm_source=newsletter&utm_medium=email&utm_campaign=test_campaign',
    hash: '#title1',
  };

  const getCurrentLocation = () => {
    const location = htmlGlobals.getLocation();
    return [
      `${location.protocol}//${location.hostname}`,
      location.port ? `:${location.port}` : '',
      `${location.pathname}${location.search}`,
    ].join('');
  };

  before(() => {
    sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document);
    sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location);
  });

  after(() => {
    htmlGlobals.getLocation.restore();
    htmlGlobals.getDocument.restore();
  });

  describe('Universal', () => {
    let ga;
    const options = {
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'auto',
      siteSpeedSampleRate: 42,
      namespace: false,
    };

    beforeEach(() => {
      window.digitalData = {
        events: [],
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('before loading', () => {
      beforeEach(() => {
        sinon.stub(ga, 'load');
        ga.once('ready', () => {
          sinon.spy(window, 'ga');
        });
      });

      afterEach(() => {
        ga.load.restore();
        window.ga.restore();
      });

      describe('#initialize', () => {
        it('should require "linkid.js" if enhanced link attribution is `true`', () => {
          ga.setOption('enhancedLinkAttribution', true);
          ddManager.initialize();
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['require', 'linkid', 'linkid.js']);
        });

        it('should create window.GoogleAnalyticsObject', () => {
          assert.ok(!window.GoogleAnalyticsObject);
          ddManager.initialize();
          assert.equal(window.GoogleAnalyticsObject, 'ga');
        });

        it('should create window.ga', () => {
          assert.ok(!window.ga);
          ddManager.initialize();
          assert.equal(typeof window.ga, 'function');
        });

        it('should create window.ga.l', () => {
          assert.ok(!window.ga);
          ddManager.initialize();
          assert.equal(typeof window.ga.l, 'number');
        });

        it('should call window.ga.create with options', () => {
          ddManager.initialize();
          assert.deepEqual(argumentsToArray(window.ga.q[0]), ['create', options.trackingId, {
            cookieDomain: 'none',
            siteSpeedSampleRate: options.siteSpeedSampleRate,
            allowLinker: true,
          }]);
        });

        it('should anonymize the ip', () => {
          ddManager.initialize();
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['set', 'anonymizeIp', true]);
        });

        it('should call #load', () => {
          ddManager.initialize();
          assert.ok(ga.load.calledOnce);
        });

        it('should not send universal user id by default', (done) => {
          window.digitalData.user = {
            userId: 'baz',
          };
          window.digitalData.page = {};
          ddManager.initialize({
            sendViewedPageEvent: false,
          });
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(!window.ga.calledWith('set', 'userId', 'baz'));
              done();
            },
          });
        });

        it('should send universal user id if sendUserId option is true and user.id is truthy', (done) => {
          window.digitalData.user = {
            userId: 'baz',
          };
          window.digitalData.page = {};
          ga.setOption('sendUserId', true);
          ddManager.initialize({
            sendViewedPageEvent: false,
          });
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(window.ga.calledWith('set', 'userId', 'baz'));
              done();
            },
          });
        });
      });
    });

    describe('loading', () => {
      it('should load', (done) => {
        sinon.stub(ga, 'load').callsFake(() => {
          window.gaplugins = {};
          ga.onLoad();
        });
        assert.ok(!ga.isLoaded());
        setTimeout(() => {
          assert.ok(ga.isLoaded());
          done();
        }, 500);
        ddManager.initialize();
      });
    });

    describe('after loading', () => {
      beforeEach((done) => {
        window.gaplugins = {};
        const tracker = {
          get: arg => (arg === 'clientId' && '123123141234') || undefined,
        };
        window.ga = function (fn) {
          if (fn instanceof Function) {
            fn(tracker);
          }
          this.getByName = () => tracker;
        };
        ddManager.once('ready', done);
        ddManager.initialize();
      });

      describe('#enrichDigitalData', () => {
        it('should add clientId', (done) => {
          ga.on('enrich', () => {
            assert.ok(window.digitalData.user.googleClientId);
            done();
          });
        });
      });
    });

    describe('after ready', () => {
      beforeEach((done) => {
        sinon.stub(ga, 'load');
        ddManager.once('ready', done);
        ddManager.initialize({
          sendViewedPageEvent: false,
        });
      });

      describe('#page', () => {
        beforeEach(() => {
          window.ga = () => {};
          sinon.stub(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should send a page view', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: window.digitalData.page,
            callback: () => {
              const page = htmlGlobals.getLocation().pathname + htmlGlobals.getLocation().search;

              assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                page,
                title: htmlGlobals.getDocument().title,
                location: getCurrentLocation(),
              })));
              done();
            },
          });
        });

        it('should send a page view (digitalData)', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              const page = htmlGlobals.getLocation().pathname + htmlGlobals.getLocation().search;
              assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                page,
                title: htmlGlobals.getDocument().title,
                location: getCurrentLocation(),
              })));
              done();
            },
          });
        });

        it('should send only one pageview using pageviewFlush', (done) => {
          ga.setOption('enhancedEcommerce', true);
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              type: 'product',
              path: htmlGlobals.getLocation().pathname,
              queryString: htmlGlobals.getLocation().search,
              url: getCurrentLocation(),
              title: htmlGlobals.getDocument().title,
            },
            callback: () => {
              const page = htmlGlobals.getLocation().pathname + htmlGlobals.getLocation().search;
              assert.ok(!window.ga.calledWith('send', 'pageview', cleanObject({
                page,
                title: htmlGlobals.getDocument().title,
                location: getCurrentLocation(),
              })));
              window.digitalData.events.push({
                name: 'Viewed Product Detail',
                product: {
                  id: '123',
                  unitSalePrice: 1000,
                },
                callback: () => {
                  assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                    page,
                    title: htmlGlobals.getDocument().title,
                    location: getCurrentLocation(),
                  })));
                  done();
                },
              });
            },
          });
        });

        it('should omit location on subsequent page views', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: window.digitalData.page,
            callback: () => {
              const page = htmlGlobals.getLocation().pathname + htmlGlobals.getLocation().search;
              assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                page,
                title: htmlGlobals.getDocument().title,
                location: getCurrentLocation(),
              })));
              window.digitalData.events.push({
                name: 'Viewed Page',
                page: window.digitalData.page,
                callback: () => {
                  assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                    page,
                    title: htmlGlobals.getDocument().title,
                  })));
                  done();
                },
              });
            },
          });
        });

        it('should set the tracker\'s page object', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {},
            callback: () => {
              window.ga.calledWith('set', {
                page: htmlGlobals.getLocation().pathname,
                title: htmlGlobals.getDocument().title,
              });
              done();
            },
          });
        });

        it('should send a page view with properties', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              path: '/path',
              name: 'page name',
              url: 'url',
            },
            callback: () => {
              window.ga.calledWith('send', 'pageview', {
                page: '/path',
                title: 'page name',
                location: 'url',
              });
              done();
            },
          });
        });

        it('should send a page view with properties', (done) => {
          window.digitalData.page = {
            path: '/path',
            name: 'page name',
            url: 'url',
          };
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              window.ga.calledWith('send', 'pageview', {
                page: '/path',
                title: 'page name',
                location: 'url',
              });
              done();
            },
          });
        });

        it('should send the query if its included', (done) => {
          ga.setOption('includeSearch', true);
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              name: 'page name',
              path: '/path',
              queryString: '?q=1',
              url: 'url',
            },
            callback: () => {
              window.ga.calledWith('send', 'pageview', {
                page: '/path?q=1',
                title: 'page name',
                location: 'url',
              });
              done();
            },
          });
        });

        it('should map custom dimensions, metrics & content groupings using event properties (legacy format)',
          (done) => {
            ga.setOption('metrics', {
              metric1: 'page.score',
              metric2: 'timestamp', // timestamp is added for every event inside EventManager
            });
            ga.setOption('dimensions', {
              dimension1: 'page.author',
              dimension2: 'page.postType',
              dimension3: 'test',
            });
            ga.setOption('contentGroupings', {
              contentGroup1: 'page.section',
            });
            ga.prepareCustomDimensions();
            window.digitalData.events.push({
              name: 'Viewed Page',
              page: {
                score: 21,
                author: 'Author',
                postType: 'blog',
                section: 'News',
              },
              test: 'test',
              callback: () => {
                assert.ok(window.ga.calledWith('send', 'pageview', {
                  metric1: 21,
                  metric2: sinon.match.any, // timestamp is added for every event inside EventManager
                  dimension1: 'Author',
                  dimension2: 'blog',
                  dimension3: 'test',
                  contentGroup1: 'News',
                }));
                done();
              },
            });
          });

        it('should map custom dimensions, metrics & content groups using event properties or digitalData', (done) => {
          ga.initVersion = '1.2.8';
          ga.setOption('metrics', {
            metric1: {
              type: 'digitalData',
              value: 'page.score',
            },
            metric2: {
              type: 'event',
              value: 'timestamp',
            }, // timestamp is added for every event inside EventManager
          });
          ga.setOption('dimensions', {
            dimension1: {
              type: 'digitalData',
              value: 'page.author',
            },
            dimension2: {
              type: 'digitalData',
              value: 'page.postType',
            },
            dimension3: {
              type: 'event',
              value: 'test',
            },
          });
          ga.setOption('contentGroups', {
            contentGroup1: {
              type: 'digitalData',
              value: 'page.section',
            },
          });
          ga.prepareCustomDimensions();
          window.digitalData.page = {
            score: 21,
            author: 'Author',
            postType: 'blog',
            section: 'News',
          };
          window.digitalData.events.push({
            name: 'Viewed Page',
            test: 'test',
            callback: () => {
              assert.ok(window.ga.calledWith('set', {
                metric1: 21,
                dimension1: 'Author',
                dimension2: 'blog',
                contentGroup1: 'News',
              }));

              const page = htmlGlobals.getLocation().pathname + htmlGlobals.getLocation().search;
              // event based metrics & dimensions send with hit
              assert.ok(window.ga.calledWith('send', 'pageview', cleanObject({
                metric2: sinon.match.any, // timestamp is added for every event inside EventManager
                dimension3: 'test',
                title: htmlGlobals.getDocument().title,
                page,
                location: getCurrentLocation(),
              })));

              done();
            },
          });
        });
      });

      describe('#track', () => {
        beforeEach(() => {
          window.ga = () => {};
          sinon.spy(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should send an event', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Test Event',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'Test Event',
                eventValue: 0,
                nonInteraction: false,
              }));
            },
          });
        });

        it('should send a action property', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Test',
            action: 'test 123',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'test 123',
                eventValue: 0,
                nonInteraction: false,
              }));
            },
          });
        });

        it('should send a category property', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Test Event',
            category: 'category',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'category',
                eventAction: 'Test Event',
                eventValue: 0,
                nonInteraction: false,
              }));
            },
          });
        });

        it('should send a label property', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'event',
            label: 'label',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'event',
                eventLabel: 'label',
                eventValue: 0,
                nonInteraction: false,
              }));
            },
          });
        });

        it('should send a rounded value property', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            value: 1.1,
            name: 'Test Event',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'Test Event',
                eventValue: 1,
                nonInteraction: false,
              }));
            },
          });
        });

        it('should send a non-interaction property', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Test Event',
            nonInteraction: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventCategory: 'All',
                eventAction: 'Test Event',
                eventValue: 0,
                nonInteraction: true,
              }));
            },
          });
        });

        it('should map custom dimensions & metrics', () => {
          ga.initVersion = '1.2.8';
          ga.setOption('metrics', {
            metric1: {
              type: 'event',
              value: 'loadTime',
            },
            metric2: {
              type: 'event',
              value: 'levelAchieved',
            },
          });
          ga.setOption('dimensions', {
            dimension2: {
              type: 'event',
              value: 'referrer',
            },
          });
          ga.prepareCustomDimensions();

          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Level Unlocked',
            loadTime: '100',
            levelAchieved: '5',
            referrer: 'Google',
            callback: () => {
              assert.ok(window.ga.calledWith('send', 'event', {
                eventAction: 'Level Unlocked',
                eventCategory: 'All',
                eventValue: 0,
                nonInteraction: false,
                metric1: '100',
                metric2: '5',
                dimension2: 'Google',
              }));
            },
          });
        });

        it('should map custom dimensions & metrics (legacy version)', () => {
          ga.setOption('metrics', {
            metric1: 'loadTime',
            metric2: 'levelAchieved',
          });
          ga.setOption('dimensions', {
            dimension2: 'referrer',
          });
          ga.prepareCustomDimensions();

          window.digitalData.events.push({
            name: 'Level Unlocked',
            loadTime: '100',
            levelAchieved: '5',
            referrer: 'Google',
            callback: () => {
              assert.ok(window.ga.calledWith('set', {
                metric1: '100',
                metric2: '5',
                dimension2: 'Google',
              }));
            },
          });
        });
      });

      describe('ecommerce', () => {
        beforeEach(() => {
          window.ga = () => {};
          sinon.stub(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should require ecommerce.js', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: 'e213e4da',
              lineItems: [
                {
                  product: {
                    id: '123',
                  },
                  quantity: 1,
                },
              ],
              total: 1000,
            },
            callback: () => {
              assert.ok(window.ga.calledWith('require', 'ecommerce'));
            },
          });
        });

        it('should send simple ecommerce data', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06',
              lineItems: [
                {
                  product: {
                    id: '123',
                  },
                  quantity: 1,
                },
              ],
              total: 1000,
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ecommerce:addTransaction', {
                id: '7306cc06',
                affiliation: undefined,
                shipping: undefined,
                tax: undefined,
                revenue: 1000,
                currency: undefined,
              }));
              assert.ok(window.ga.calledWith('ecommerce:addItem', {
                id: '123',
                category: undefined,
                quantity: 1,
                price: undefined,
                name: undefined,
                sku: undefined,
                currency: undefined,
              }));
              assert.ok(window.ga.calledWith('ecommerce:send'));
            },
          });
        });

        const transaction = {
          orderId: '780bc55',
          total: 99.99,
          shippingCost: 13.99,
          tax: 20.99,
          currency: 'USD',
          lineItems: [
            {
              product: {
                id: '123',
                unitPrice: 24.75,
                unitSalePrice: 24.75,
                name: 'my product',
                skuCode: 'p-298',
              },
              quantity: 1,
            },
            {
              product: {
                id: '234',
                unitPrice: 24.75,
                unitSalePrice: 24.75,
                name: 'other product',
                skuCode: 'p-299',
              },
              quantity: 3,
            },
          ],
        };

        it('should send ecommerce data', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Completed Transaction',
            transaction,
            callback: () => {
              assert.ok(window.ga.calledWith('ecommerce:addTransaction', {
                id: '780bc55',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.99,
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:addItem', {
                id: '123',
                category: undefined,
                name: 'my product',
                price: 24.75,
                quantity: 1,
                sku: 'p-298',
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:addItem', {
                id: '234',
                category: undefined,
                name: 'other product',
                price: 24.75,
                sku: 'p-299',
                quantity: 3,
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:send'));
            },
          });
        });

        it('should send ecommerce data (digitalData)', () => {
          window.digitalData.transaction = transaction;
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Completed Transaction',
            callback: () => {
              assert.ok(window.ga.calledWith('ecommerce:addTransaction', {
                id: '780bc55',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.99,
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:addItem', {
                id: '123',
                category: undefined,
                name: 'my product',
                price: 24.75,
                quantity: 1,
                sku: 'p-298',
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:addItem', {
                id: '234',
                category: undefined,
                name: 'other product',
                price: 24.75,
                sku: 'p-299',
                quantity: 3,
                currency: 'USD',
              }));
              assert.ok(window.ga.calledWith('ecommerce:send'));
            },
          });
        });

        it('should fallback to revenue', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
          window.digitalData.events.push({
            name: 'Completed Transaction',
            transaction: {
              orderId: '5d4c7cb5',
              shippingCost: 13.99,
              tax: 20.99,
              total: 99.9,
              currency: 'USD',
              lineItems: [],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ecommerce:addTransaction', {
                id: '5d4c7cb5',
                affiliation: undefined,
                shipping: 13.99,
                tax: 20.99,
                revenue: 99.9,
                currency: 'USD',
              }));
            },
          });
        });

        it('should pass custom currency', () => {
          window.digitalData.events.push({ name: 'Viewed Page' });
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
                assert.ok(window.ga.calledWith('ecommerce:addTransaction', {
                  id: '5d4c7cb5',
                  revenue: 99.9,
                  shipping: 13.99,
                  affiliation: undefined,
                  tax: 20.99,
                  currency: 'EUR',
                }));
              },
            },
          });
        });
      });
    });
  });

  describe('Universal Enhanced Ecommerce', () => {
    let ga;
    const options = {
      enhancedEcommerce: true,
      trackingId: 'UA-51485228-7',
      anonymizeIp: true,
      domain: 'none',
      defaultCurrency: 'USD',
      siteSpeedSampleRate: 42,
      namespace: false,
    };

    beforeEach(() => {
      window.digitalData = {
        events: [],
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      ddManager.addIntegration('Google Analytics', ga);
    });

    afterEach(() => {
      ga.reset();
      ddManager.reset();
      reset();
    });

    describe('after loading', () => {
      beforeEach((done) => {
        sinon.stub(ga, 'load');
        ddManager.once('ready', done);
        ddManager.initialize({
          sendViewedPageEvent: false,
        });
      });

      describe('enhanced ecommerce', () => {
        beforeEach(() => {
          window.ga = () => {};
          sinon.stub(window, 'ga');
        });

        afterEach(() => {
          window.ga.restore();
        });

        it('should require ec.js', () => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(window.ga.args.length > 0);
              assert.ok(window.ga.calledWith('require', 'ec'));
            },
          });
        });

        it('should set currency for ec.js to default', () => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(window.ga.calledWith('set', '&cu', 'USD'));
            },
          });
        });

        it('should set currency for ec.js to custom currency', () => {
          window.digitalData.website = {
            currency: 'EUR',
          };
          window.digitalData.events.push({
            name: 'Viewed Page',
            callback: () => {
              assert.ok(window.ga.calledWith('set', '&cu', 'EUR'));
            },
          });
        });

        it('should send added product data', () => {
          window.digitalData.events.push({
            name: 'Added Product',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
            },
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'add', {}));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: false }));
            },
          });
        });

        it('should send added product data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Added Product',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100,
            },
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'add', {}));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: false }));
            },
          });
        });

        it('should send added product data from digitalData', () => {
          window.digitalData.product = {
            id: 'p-298',
            currency: 'CAD',
            unitPrice: 24.75,
            name: 'my product',
            category: 'cat 1',
            skuCode: 'p-298',
          };
          window.digitalData.events.push({
            name: 'Added Product',
            product: 'p-298',
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'add', {}));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Added Product', { nonInteraction: false }));
            },
          });
        });

        it('should send send label tracking enhanced ecommerce events with Univeral Analytics', () => {
          window.digitalData.events.push({
            name: 'Added Product',
            label: 'sample label',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
            },
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'add', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Added Product', 'sample label', { nonInteraction: false }));
            },
          });
        });

        it('should send removed product data', () => {
          window.digitalData.events.push({
            name: 'Removed Product',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
            },
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'remove', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Removed Product', { nonInteraction: false }));
            },
          });
        });

        it('should send removed product data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Removed Product',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100,
            },
            quantity: 1,
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'remove', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Removed Product', { nonInteraction: false }));
            },
          });
        });

        it('should send viewed product detail data (legacy DDL product.category)', () => {
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'detail', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product detail data', () => {
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: ['cat 1', 'cat 2'],
              skuCode: 'p-298',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1/cat 2',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'detail', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product detail data (digitalData)', () => {
          window.digitalData.product = {
            id: '123',
            currency: 'CAD',
            unitPrice: 24.75,
            name: 'my product',
            category: ['cat 1', 'cat 2'],
            skuCode: 'p-298',
          };
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1/cat 2',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'detail', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product detail data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100,
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'detail', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product detail data with custom dimensions and metrics (new initVersion)', () => {
          ga.initVersion = '1.2.8';
          ga.setOption('dimensions', {
            dimension10: {
              type: 'product',
              value: 'stock',
            },
          });
          ga.setOption('metrics', {
            metric10: {
              type: 'product',
              value: 'weight',
            },
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            product: {
              id: '123',
              currency: 'CAD',
              unitPrice: 24.75,
              name: 'my product',
              category: 'cat 1',
              skuCode: 'p-298',
              stock: 25,
              weight: 100,
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'detail', {}));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Product Detail', { nonInteraction: true }));
            },
          });
        });

        it('should send clicked product data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Clicked Product',
            listItem: {
              product: {
                id: '123',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
                stock: 25,
                weight: 100,
              },
              listId: 'search results',
              listName: 'Search Results',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '123',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'click', {
                list: 'Search Results',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: false }));
            },
          });
        });

        it('should send clicked product data with data from DDL', () => {
          window.digitalData.listing = {
            listId: 'search_results',
            listName: 'Search Results',
            items: [
              {
                id: 'p-298',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
              },
            ],
          };
          window.digitalData.events.push({
            name: 'Clicked Product',
            listItem: {
              product: 'p-298',
              listId: 'search_results',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                position: 1,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'click', {
                list: 'Search Results',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Clicked Product', { nonInteraction: false }));
            },
          });
        });

        it('should send viewed product data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.events.push({
            name: 'Viewed Product',
            listItem: {
              product: {
                id: 'p-298',
                currency: 'CAD',
                unitPrice: 24.75,
                name: 'my product',
                category: 'cat 1',
                skuCode: 'p-298',
                stock: 25,
                weight: 100,
              },
              listId: 'search results',
              listName: 'Search Results',
              position: 2,
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product data array', () => {
          window.digitalData.events.push({
            name: 'Viewed Product',
            listItems: [
              {
                product: {
                  id: 'p-298',
                  currency: 'CAD',
                  unitPrice: 24.75,
                  name: 'my product',
                  category: 'cat 1',
                  skuCode: 'p-298',
                },
                listId: 'search_results',
                listName: 'Search Results',
                position: 2,
              },
              {
                product: {
                  id: 'p-299',
                  currency: 'CAD',
                  unitPrice: 24.75,
                  name: 'my product',
                  category: 'cat 1',
                  skuCode: 'p-299',
                },
                listId: 'search_results',
                listName: 'Search Results',
                position: 2,
              },
            ],
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }));
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-299',
                name: 'my product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product data from DDL', () => {
          window.digitalData.listing = {
            listId: 'search_results',
            listName: 'Search Results',
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
              },
            ],
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItem: {
              product: 'p-299',
              listId: 'search_results',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed product with multiple products data from DDL', () => {
          window.digitalData.listing = {
            listId: 'search_results',
            listName: 'Search Results',
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
              },
            ],
          };
          window.digitalData.events.push({
            name: 'Viewed Product',
            category: 'Ecommerce',
            listItems: [
              {
                product: 'p-298',
                listId: 'search_results',
              },
              {
                product: 'p-299',
                listId: 'search_results',
              },
            ],
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-298',
                name: 'my product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 1,
              }));
              assert.ok(window.ga.calledWith('ec:addImpression', {
                id: 'p-299',
                name: 'my other product',
                list: 'Search Results',
                category: 'cat 1',
                brand: undefined,
                price: 24.75,
                currency: 'CAD',
                variant: undefined,
                position: 2,
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Ecommerce', 'Viewed Product', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed promotion data', () => {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed promotion data with custom action', () => {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            action: 'Viewed Campaign #123',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Promo', 'Viewed Campaign #123', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed promotion data array', () => {
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaigns: [
              {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                design: 'summer_banner2',
                position: 'banner_slot1',
              },
              {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                design: 'summer_banner2',
                position: 'banner_slot1',
              },
            ],
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed promotion data from DDL', () => {
          window.digitalData.campaigns = [{
            id: 'PROMO_1234',
            name: 'Summer Sale',
            design: 'summer_banner2',
            position: 'banner_slot1',
          }];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaign: 'PROMO_1234',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: true }));
            },
          });
        });

        it('should send viewed promotion data from DDL', () => {
          window.digitalData.campaigns = [
            {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1',
            },
            {
              id: 'PROMO_2345',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1',
            },
          ];
          window.digitalData.events.push({
            name: 'Viewed Campaign',
            category: 'Promo',
            campaigns: ['PROMO_1234', 'PROMO_2345'],
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_2345',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('send', 'event', 'Promo', 'Viewed Campaign', { nonInteraction: true }));
            },
          });
        });

        it('should send clicked promotion data', () => {
          window.digitalData.events.push({
            name: 'Clicked Campaign',
            category: 'Promo',
            campaign: {
              id: 'PROMO_1234',
              name: 'Summer Sale',
              design: 'summer_banner2',
              position: 'banner_slot1',
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addPromo', {
                id: 'PROMO_1234',
                name: 'Summer Sale',
                creative: 'summer_banner2',
                position: 'banner_slot1',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'promo_click', {}));
              assert.ok(window.ga.calledWith('send', 'event', 'Promo', 'Clicked Campaign', { nonInteraction: false }));
            },
          });
        });

        it('should send started order data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
          window.digitalData.cart = {
            currency: 'CAD',
            lineItems: [
              {
                product: {
                  id: 'p-298',
                  unitPrice: 24.75,
                  name: 'my product',
                  skuCode: 'p-298',
                  stock: 25,
                  weight: 100,
                },
                quantity: 1,
              },
              {
                product: {
                  id: 'p-299',
                  unitPrice: 24.75,
                  name: 'other product',
                  skuCode: 'p-299',
                  stock: 30,
                  weight: 200,
                },
                quantity: 3,
              },
            ],
          };
          window.digitalData.events.push({
            name: 'Viewed Checkout Step',
            step: 1,
            paymentMethod: 'Visa',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: undefined,
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-299',
                name: 'other product',
                category: undefined,
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 30,
                metric10: 200,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'checkout', {
                step: 1,
                option: 'Visa',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Viewed Checkout Step', { nonInteraction: true }));
            },
          });
        });

        it('should send completed checkout step data', () => {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            shippingMethod: 'FedEx',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'checkout_option', {
                step: 2,
                option: 'FedEx',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: false }));
            },
          });
        });

        it('should send completed checkout step data with all options', () => {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            paymentMethod: 'Visa',
            shippingMethod: 'FedEx',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'checkout_option', {
                step: 2,
                option: 'Visa, FedEx',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: false }));
            },
          });
        });

        it('should not send completed checkout step data without a step', () => {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            paymentMethod: 'Visa',
            callback: () => {
              assert.ok(!window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: false }));
            },
          });
        });

        it('should not send completed checkout step data without an option', () => {
          window.digitalData.events.push({
            name: 'Completed Checkout Step',
            category: 'Ecommerce',
            step: 2,
            callback: () => {
              assert.ok(!window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Checkout Step', { nonInteraction: false }));
            },
          });
        });

        it('should send simple completed order data', () => {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '7306cc06',
              lineItems: [
                {
                  product: {
                    id: '123',
                  },
                  quantity: 1,
                },
              ],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'purchase', {
                id: '7306cc06',
                affiliation: undefined,
                revenue: 0.0,
                tax: undefined,
                shipping: undefined,
                coupon: undefined,
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: false }));
            },
          });
        });

        it('should send simple completed order data (digitalData)', () => {
          window.digitalData.transaction = {
            orderId: '7306cc06',
            lineItems: [
              {
                product: {
                  id: '123',
                },
                quantity: 1,
              },
            ],
          };
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'purchase', {
                id: '7306cc06',
                affiliation: undefined,
                revenue: 0.0,
                tax: undefined,
                shipping: undefined,
                coupon: undefined,
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: false }));
            },
          });
        });

        it('should send completed order data with custom dimensions and metrics', () => {
          ga.setOption('productDimensions', {
            dimension10: 'stock',
          });
          ga.setOption('productMetrics', {
            metric10: 'weight',
          });
          ga.prepareCustomDimensions();
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
                    stock: 25,
                    weight: 100,
                  },
                  quantity: 1,
                },
                {
                  product: {
                    id: '234',
                    unitSalePrice: 24.75,
                    name: 'other product',
                    category: 'cat 2',
                    skuCode: 'p-299',
                    currency: 'EUR',
                    stock: 30,
                    weight: 200,
                  },
                  quantity: 3,
                },
              ],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                dimension10: 25,
                metric10: 100,
              }));
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '234',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR',
                dimension10: 30,
                metric10: 200,
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: false }));
            },
          });
        });

        it('should add coupon to product level in completed order', () => {
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
                    voucher: 'promo',
                  },
                  quantity: 1,
                },
                {
                  product: {
                    id: '234',
                    unitSalePrice: 24.75,
                    name: 'other product',
                    category: 'cat 2',
                    skuCode: 'p-299',
                    currency: 'EUR',
                  },
                  quantity: 3,
                },
              ],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: 'my product',
                category: 'cat 1',
                quantity: 1,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
                coupon: 'promo',
              }));
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: '234',
                name: 'other product',
                category: 'cat 2',
                quantity: 3,
                price: 24.75,
                brand: undefined,
                variant: undefined,
                currency: 'EUR',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'purchase', {
                id: '780bc55',
                affiliation: 'affiliation',
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: 'coupon',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Completed Transaction', { nonInteraction: false }));
            },
          });
        });

        it('completed order should fallback to revenue', () => {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '5d4c7cb5',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: [],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'purchase', {
                id: '5d4c7cb5',
                affiliation: undefined,
                revenue: 99.9,
                tax: 20.99,
                shipping: 13.99,
                coupon: undefined,
              }));
            },
          });
        });

        it('should send full refunded order data', () => {
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            transaction: {
              orderId: '780bc55',
              total: 99.9,
              tax: 20.99,
              shippingCost: 13.99,
              currency: 'CAD',
              lineItems: [],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'refund', {
                id: '780bc55',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: false }));
            },
          });
        });

        it('should send full refunded order data (digitalData)', () => {
          window.digitalData.transaction = {
            orderId: '780bc55',
            total: 99.9,
            tax: 20.99,
            shippingCost: 13.99,
            currency: 'CAD',
            lineItems: [],
          };
          window.digitalData.events.push({
            name: 'Refunded Transaction',
            category: 'Ecommerce',
            callback: () => {
              assert.ok(window.ga.calledWith('ec:setAction', 'refund', {
                id: '780bc55',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: false }));
            },
          });
        });

        it('should send partial refunded order data', () => {
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
                    skuCode: 'p-298',
                  },
                  quanity: 1,
                },
                {
                  product: {
                    skuCode: 'p-299',
                  },
                  quantity: 2,
                },
              ],
            },
            callback: () => {
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-298',
                name: undefined,
                category: undefined,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:addProduct', {
                id: 'p-299',
                name: undefined,
                category: undefined,
                quantity: 2,
                price: undefined,
                brand: undefined,
                variant: undefined,
                currency: 'CAD',
              }));
              assert.ok(window.ga.calledWith('ec:setAction', 'refund', {
                id: '780bc55',
              }));
              assert.ok(window.ga
                .calledWith('send', 'event', 'Ecommerce', 'Refunded Transaction', { nonInteraction: false }));
            },
          });
        });
      });
    });
  });
});
