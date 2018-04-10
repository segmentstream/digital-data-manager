import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import cleanObject from 'driveback-utils/cleanObject';
import { getProp } from 'driveback-utils/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  ADDED_PRODUCT_TO_WISHLIST,
  COMPLETED_TRANSACTION,
  STARTED_ORDER,
} from './../events/semanticEvents';

const FB_STANDARD_EVENTS = [
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
];

function getProductCategory(product) {
  let category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = `${category}/${product.subcategory}`;
  }
  return category;
}

class FacebookPixel extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
      usePriceAsEventValue: false,
      customEvents: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      ADDED_PRODUCT_TO_WISHLIST,
      SEARCHED_PRODUCTS,
      STARTED_ORDER,
      COMPLETED_TRANSACTION,
    ];

    this.customEvents = Object.keys(this.getOption('customEvents') || {});
    this.customEvents.forEach((customEvent) => {
      if (this.SEMANTIC_EVENTS.indexOf(customEvent) < 0) {
        this.SEMANTIC_EVENTS.push(customEvent);
      }
    });

    this.addTag({
      type: 'script',
      attr: {
        src: '//connect.facebook.net/en_US/fbevents.js',
      },
    });
  }

  initialize() {
    // non-documented support for multiple facebook ids (if comma-separated)
    const pixelIds = this.getOption('pixelId');
    if (pixelIds && !window.fbq) {
      window.fbq = window._fbq = function fbq() {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments);
        } else {
          window.fbq.queue.push(arguments);
        }
      };
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];

      pixelIds.split(',').forEach((pixelId) => {
        window.fbq('init', pixelId);
      });
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product',
        ];
        break;
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'listing.query',
        ];
        break;
      case STARTED_ORDER:
        enrichableProps = [
          'cart',
        ];
        break;
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'website.currency',
          'transaction',
        ];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const productFields = ['product.id', 'product.name', 'product.category'];
    const productValidations = {
      'product.id': {
        errors: ['required'],
        warnings: ['string'],
      },
      'product.name': {
        warnings: ['required', 'string'],
      },
      'product.category': {
        warnings: ['required', 'array'],
      },
    };
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: productFields,
        validations: productValidations,
      },
      [ADDED_PRODUCT]: {
        fields: productFields,
        validations: productValidations,
      },
      [ADDED_PRODUCT_TO_WISHLIST]: {
        fields: productFields,
        validations: productValidations,
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.query'],
        validations: {
          'listing.query': {
            errors: ['required'],
          },
        },
      },
      [STARTED_ORDER]: {
        fields: [
          'transaction.total',
          'transaction.currency',
          'transaction.lineItems[].product.id',
        ],
        validations: {
          'cart.total': {
            errors: ['numeric'],
          },
          'cart.currency': {
            errors: ['string'],
          },
          'cart.lineItems[].product.id': {
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.total',
          'transaction.currency',
          'transaction.lineItems[].product.id',
        ],
        validations: {
          'transaction.total': {
            errors: ['required', 'numeric'],
          },
          'transaction.currency': {
            errors: ['required', 'string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
    };

    return config[event.name];
  }

  isLoaded() {
    return !!(window.fbq && window.fbq.callMethod);
  }

  reset() {
    deleteProperty(window, 'fbq');
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (event.name === VIEWED_PRODUCT_DETAIL) {
      this.onViewedProductDetail(event);
    } else if (event.name === ADDED_PRODUCT) {
      this.onAddedProduct(event);
    } else if (event.name === ADDED_PRODUCT_TO_WISHLIST) {
      this.onAddedProductToWishlist(event);
    } else if (event.name === SEARCHED_PRODUCTS) {
      this.onSearchedProducts(event);
    } else if (event.name === STARTED_ORDER) {
      this.onStartedOrder(event);
    } else if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event);
    } else {
      this.onCustomEvent(event);
    }
  }

  onViewedPage() {
    window.fbq('track', 'PageView');
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    const category = getProductCategory(product);
    window.fbq('track', 'ViewContent', cleanObject({
      content_ids: [product.id || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: category || '',
      value: this.getOption('usePriceAsEventValue') ? product.unitSalePrice : event.value,
    }));
  }

  onAddedProduct(event) {
    const product = event.product || {};
    const category = getProductCategory(product);
    window.fbq('track', 'AddToCart', cleanObject({
      content_ids: [product.id || ''],
      content_type: 'product',
      content_name: product.name,
      content_category: category,
      value: this.getOption('usePriceAsEventValue') ? product.unitSalePrice : event.value,
    }));
  }

  onAddedProductToWishlist(event) {
    const product = event.product || {};
    const category = getProductCategory(product);
    window.fbq('track', 'AddToWishlist', cleanObject({
      content_ids: [product.id || ''],
      content_type: 'product',
      content_name: product.name,
      content_category: category,
      value: this.getOption('usePriceAsEventValue') ? product.unitSalePrice : event.value,
    }));
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    window.fbq('track', 'Search', cleanObject({
      search_string: listing.query,
    }));
  }

  onStartedOrder(event) {
    const cart = event.cart || {};
    const lineItems = cart.lineItems || [];
    window.fbq('track', 'InitiateCheckout', cleanObject({
      content_ids: lineItems.length ? lineItems.map(lineItem => getProp(lineItem, 'product.id')) : undefined,
      content_type: 'product',
      currency: cart.currency,
      value: (this.getOption('usePriceAsEventValue')) ? cart.total : event.value,
    }));
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    if (transaction.lineItems && transaction.lineItems.length) {
      const contentIds = transaction.lineItems.map(lineItem => getProp(lineItem, 'product.id'));

      window.fbq('track', 'Purchase', cleanObject({
        content_ids: contentIds,
        content_type: 'product',
        currency: transaction.currency,
        value: transaction.total,
      }));
    }
  }

  onCustomEvent(event) {
    const customEvents = this.getOption('customEvents');
    const customEventName = customEvents[event.name];
    if (customEventName) {
      if (FB_STANDARD_EVENTS.indexOf(customEventName) < 0) {
        window.fbq('trackCustom', customEventName);
      } else {
        window.fbq('track', customEventName);
      }
    }
  }
}

export default FacebookPixel;
