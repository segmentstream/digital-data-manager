import deleteProperty from 'driveback-utils/deleteProperty';
import { getProp } from 'driveback-utils/dotProp';
import cleanObject from 'driveback-utils/cleanObject';
import semver from 'driveback-utils/semver';
import normalizeString from 'driveback-utils/normalizeString';
import md5 from 'crypto-js/md5';
import Integration from '../Integration';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
} from '../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
];

function lineItemsToCriteoItems(lineItems, feedWithGroupedProducts) {
  return lineItems
    .filter(lineItem => (
      !!lineItem.product && !!lineItem.product.id && lineItem.product.unitSalePrice > 0
    ))
    .map((lineItem) => {
      const productId = (!feedWithGroupedProducts) ? lineItem.product.id : lineItem.product.skuCode;
      return {
        id: productId,
        price: lineItem.product.unitSalePrice,
        quantity: lineItem.quantity || 1,
      };
    });
}

class Criteo extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      account: '',
      noConflict: false,
      customDeduplication: false,
      userSegmentVar: undefined,
      feedWithGroupedProducts: false,
      multiCurrency: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//static.criteo.net/js/ld/ld.js',
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'website.type',
          'user.email',
          'user.emailHash',
          'page.type',
        ];
        break;
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = ['product'];
        break;
      case VIEWED_PRODUCT_LISTING:
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'listing.items',
        ];
        break;
      case VIEWED_CART:
        enrichableProps = [
          'cart',
        ];
        break;
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'context.campaign',
          'transaction',
        ];
        break;
      default:
      // do nothing;
    }

    const userSegmentVar = this.getOption('userSegmentVar');
    if (userSegmentVar) {
      enrichableProps.push(userSegmentVar);
    }

    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const listingValidations = {};
    const listingFields = [];
    const listingItemsCount = getProp(event, 'listing.items.length') || 0;
    for (let i = 0; i < Math.min(listingItemsCount, 4); i += 1) {
      const fieldName = ['listing.items', i, 'id'].join('.');
      listingFields.push(fieldName);
      listingValidations[fieldName] = {
        errors: ['required'],
        warnings: ['string'],
      };
    }

    const config = {
      [VIEWED_PAGE]: {
        fields: [
          'website.type',
          'page.type',
          'user.email',
          'user.emailHash',
        ],
        validations: {
          'website.type': {
            warnings: ['string'],
          },
          'page.type': {
            errors: ['required', 'string'],
          },
          'user.email': {
            errors: ['string'],
          },
          'user.emailHash': {
            errors: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.skuCode',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: listingFields,
        validations: listingValidations,
      },
      [SEARCHED_PRODUCTS]: {
        fields: listingFields,
        validations: listingValidations,
      },
      [VIEWED_CART]: {
        fields: [
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.skuCode',
          'cart.lineItems[].product.unitSalePrice',
          'cart.lineItems[].quantity',
        ],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'cart.lineItems[].product.unitSalePrice': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'cart.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.skuCode',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
          'transaction.isFirst',
          'context.campaign.source',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'transaction.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
          },
          'transaction.isFirst': {
            warnings: ['boolean'],
          },
          'context.campaign.source': {
            warnings: ['string'],
          },
        },
      },
    };

    return config[event.name];
  }

  getUserSegment(event) {
    const userSegmentVar = this.getOption('userSegmentVar');
    let userSegment;
    if (userSegmentVar) {
      userSegment = getProp(event, userSegmentVar);
    }
    return userSegment;
  }

  pushCriteoQueue(criteoEvent, userSegment) {
    if (criteoEvent) {
      if (userSegment !== undefined) {
        criteoEvent.user_segment = userSegment;
      }
      this.criteo_q.push(cleanObject(criteoEvent));
    }

    // final push to criteo in signle hit
    if (this.criteo_q.length === 1) {
      window.criteo_q.push(this.criteo_q[0]);
    } else {
      window.criteo_q.push(this.criteo_q);
    }
    this.criteo_q = [];
    this.pageTracked = true;
  }

  initialize() {
    window.criteo_q = window.criteo_q || [];
    this.criteo_q = [];
  }

  isLoaded() {
    return !!(window.criteo_q && !Array.isArray(window.criteo_q));
  }

  reset() {
    deleteProperty(window, 'criteo_q');
  }

  getDeviceType(siteType) {
    let deviceType;

    if (!siteType || siteType === 'adaptive' || siteType === 'responsive') {
      const tablet = /iPad/.test(navigator.userAgent);
      const mobile = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Silk/.test(navigator.userAgent);
      if (tablet) {
        deviceType = 't';
      } else if (mobile) {
        deviceType = 'm';
      } else {
        deviceType = 'd';
      }
    } else {
      if (siteType) {
        siteType = siteType.toLocaleLowerCase();
      }
      if (['desktop', 'tablet', 'mobile'].indexOf(siteType) < 0) {
        siteType = 'desktop';
      }
      deviceType = siteType.charAt(0); // "d", "m", "t"
    }

    return deviceType;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [SEARCHED_PRODUCTS]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SUBSCRIBED]: 'onSubscribed',
    };

    if (this.getOption('noConflict') !== true || event.name === SUBSCRIBED) {
      const method = methods[event.name];
      if (method) {
        this[method](event);
      }
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;

    const { page } = event;
    let siteType;
    if (event.version && page && semver.cmp(event.version, '1.1.0') < 0) {
      ({ siteType } = page);
    } else if (event.website) {
      siteType = event.website.type;
    }

    this.criteo_q.push({
      event: 'setAccount',
      account: this.getOption('account'),
    });
    this.criteo_q.push({
      event: 'setSiteType',
      type: this.getDeviceType(siteType),
    });

    if (event.user) {
      let emailHash;
      if (event.user.emailHash) {
        ({ emailHash } = event.user);
      } else if (event.user.email) {
        const email = normalizeString(event.user.email);
        emailHash = md5(email).toString();
      }
      this.criteo_q.push({
        event: 'setEmail',
        email: emailHash,
      });
    } else {
      this.criteo_q.push({
        event: 'setEmail',
        email: '',
      });
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          const criteoEvent = {
            event: 'viewHome',
          };
          this.pushCriteoQueue(criteoEvent, this.getUserSegment(event));
        }
      }, 100);
    }
  }

  onViewedProductListing(event) {
    const { listing } = event;
    if (!listing || !listing.items || !listing.items.length) return;

    const { items } = listing;
    const productIds = [];
    let length = 3;
    if (items.length < 3) {
      ({ length } = items);
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    for (let i = 0; i < length; i += 1) {
      const productId = (!feedWithGroupedProducts) ? items[i].id : items[i].skuCode;
      if (productId) {
        productIds.push(productId);
      }
    }
    if (productIds.length > 0) {
      this.pushCriteoQueue(
        {
          event: 'viewList',
          item: productIds,
        },
        this.getUserSegment(event),
      );
    }
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    const productId = (!this.getOption('feedWithGroupedProducts')) ? product.id : product.skuCode;
    if (productId) {
      this.pushCriteoQueue(
        {
          event: 'viewItem',
          item: productId,
        },
        this.getUserSegment(event),
      );
    }
  }

  onViewedCart(event) {
    const { cart } = event;
    if (cart && cart.lineItems && cart.lineItems.length > 0) {
      const products = lineItemsToCriteoItems(cart.lineItems, this.getOption('feedWithGroupedProducts'));
      if (products.length > 0) {
        this.pushCriteoQueue(
          {
            event: 'viewBasket',
            currency: (this.getOption('multiCurrency')) ? cart.currency : undefined,
            item: products,
          },
          this.getUserSegment(event),
        );
      }
    }
  }

  onCompletedTransaction(event) {
    const { transaction } = event;
    if (transaction && transaction.lineItems && transaction.lineItems.length > 0) {
      const products = lineItemsToCriteoItems(transaction.lineItems, this.getOption('feedWithGroupedProducts'));
      if (products.length > 0) {
        const customDeduplication = this.getOption('customDeduplication');

        const criteoEvent = {
          event: 'trackTransaction',
          id: transaction.orderId,
          currency: (this.getOption('multiCurrency')) ? transaction.currency : undefined,
          new_customer: (transaction.isFirst) ? 1 : 0,
          item: products,
        };

        if (customDeduplication) {
          const { context } = event;
          if (
            context
            && context.campaign
            && context.campaign.source
            && context.campaign.source.toLocaleLowerCase().indexOf('criteo') >= 0
          ) {
            criteoEvent.deduplication = 1;
          } else {
            criteoEvent.deduplication = 0;
          }
        }

        this.pushCriteoQueue(
          criteoEvent,
          this.getUserSegment(event),
        );
      }
    }
  }

  onSubscribed(event) {
    const { user } = event;
    if (user && user.email) {
      const email = normalizeString(user.email);
      const emailHash = md5(email).toString();
      window.criteo_q.push({
        event: 'setEmail',
        email: emailHash,
      });
    }
  }
}

export default Criteo;
