import Integration from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import cleanObject from './../functions/cleanObject';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  ADDED_PRODUCT_TO_WISHLIST,
  COMPLETED_TRANSACTION,
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
    category = category + '/' + product.subcategory;
  }
  return category;
}

class FacebookPixel extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      ADDED_PRODUCT_TO_WISHLIST,
      SEARCHED_PRODUCTS,
      COMPLETED_TRANSACTION,
    ];

    this.customEvents = Object.keys(this.getOption('customEvents') || {});
    for (const customEvent of this.customEvents) {
      if (this.SEMANTIC_EVENTS.indexOf(customEvent) < 0) {
        this.SEMANTIC_EVENTS.push(customEvent);
      }
    }

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
      this.load(this.onLoad);

      for (const pixelId of pixelIds.split(',')) {
        window.fbq('init', pixelId);
      }
    } else {
      this.onLoad();
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
      this.onViewedProductDetail(event.product);
    } else if (event.name === ADDED_PRODUCT) {
      this.onAddedProduct(event.product);
    } else if (event.name === ADDED_PRODUCT_TO_WISHLIST) {
      this.onAddedProductToWishlist(event.product);
    } else if (event.name === SEARCHED_PRODUCTS) {
      this.onSearchedProducts(event.listing);
    } else if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event.transaction);
    } else {
      this.onCustomEvent(event);
    }
  }

  onViewedPage() {
    window.fbq('track', 'PageView');
  }

  onViewedProductDetail(product) {
    const category = getProductCategory(product);
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: category || '',
    });
  }

  onAddedProduct(product) {
    if (product && typeof product === 'object') {
      const category = getProductCategory(product);
      window.fbq('track', 'AddToCart', cleanObject({
        content_ids: [product.id || ''],
        content_type: 'product',
        content_name: product.name,
        content_category: category,
      }));
    }
  }

  onAddedProductToWishlist(product) {
    product = product || {};
    const category = getProductCategory(product);
    window.fbq('track', 'AddToWishlist', cleanObject({
      content_ids: [product.id || ''],
      content_type: 'product',
      content_name: product.name,
      content_category: category,
    }));
  }

  onSearchedProducts(listing) {
    listing = listing || {};
    window.fbq('track', 'Search', cleanObject({
      search_string: listing.query,
    }));
  }

  onCompletedTransaction(transaction) {
    if (transaction.lineItems && transaction.lineItems.length) {
      const contentIds = transaction.lineItems.map((lineItem) => {
        return getProp(lineItem, 'product.id');
      });

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
