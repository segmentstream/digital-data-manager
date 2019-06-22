import deleteProperty from '@segmentstream/utils/deleteProperty';
import cleanObject from '@segmentstream/utils/cleanObject';
import { getProp } from '@segmentstream/utils/dotProp';
import Integration from '../Integration';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  COMPLETED_TRANSACTION,
} from '../events/semanticEvents';

function getListingCategory(listing) {
  let { category } = listing;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && listing.subcategory) {
    category = `${category}/${listing.subcategory}`;
  }
  return category;
}

class Glami extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      apiKey: '',
      siteDomain: undefined,
      feedWithGroupedProducts: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      ADDED_PRODUCT,
      COMPLETED_TRANSACTION,
    ];

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://www.glami.ru/js/compiled/pt.js',
      },
    });
  }

  initialize() {
    const apiKey = this.getOption('apiKey');
    const siteDomain = this.getOption('siteDomain');
    window.glami = window.glami || function glamiStub() {
      (window.glami.q = window.glami.q || []).push(arguments);
    };
    window.glami('create', apiKey, siteDomain);
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
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          'listing',
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
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.total',
          'transaction.currency',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.skuCode',
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
          'transaction.lineItems[].product.skuCode': {
            warnings: ['string'],
          },
        },
      },
    };

    return config[event.name];
  }

  isLoaded() {
    return !!(window.glami && !window.glami.q);
  }

  reset() {
    deleteProperty(window, 'glami');
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (event.name === VIEWED_PRODUCT_DETAIL) {
      this.onViewedProductDetail(event);
    } else if (event.name === VIEWED_PRODUCT_LISTING) {
      this.onViewedProductListing(event);
    } else if (event.name === ADDED_PRODUCT) {
      this.onAddedProduct(event);
    } else if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event);
    }
  }

  onViewedPage() {
    window.glami('track', 'PageView');
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productId = (!feedWithGroupedProducts) ? product.id : product.skuCode;

    window.glami('track', 'ViewContent', {
      content_type: 'product',
      item_ids: [productId || ''],
      product_names: [product.name || ''],
    });
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const listingItems = listing.items || [];
    const category = getListingCategory(listing);
    const { categoryId } = listing;
    if (!category && !categoryId) return;

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    window.glami('track', 'ViewContent', cleanObject({
      content_type: 'category',
      item_ids: listingItems.slice(0, 10).map(product => ((!feedWithGroupedProducts) ? product.id : product.skuCode)),
      product_names: listingItems.slice(0, 10).map(product => product.name),
      category_id: categoryId,
      category_text: category,
    }));
  }

  onAddedProduct(event) {
    const product = event.product || {};
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');

    window.glami('track', 'AddToCart', cleanObject({
      item_ids: (feedWithGroupedProducts) ? [product.skuCode || ''] : [product.id || ''],
      product_names: [product.name || ''],
      value: product.unitSalePrice,
      currency: product.currency,
    }));
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const lineItems = transaction.lineItems || [];
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const idProp = (feedWithGroupedProducts) ? 'product.skuCode' : 'product.id';
    const productIds = lineItems.length
      ? transaction.lineItems.map(lineItem => getProp(lineItem, idProp)) : undefined;
    const productNames = lineItems.length
      ? transaction.lineItems.map(lineItem => getProp(lineItem, 'product.name')) : undefined;

    window.glami('track', 'Purchase', cleanObject({
      item_ids: productIds,
      product_names: productNames,
      value: transaction.total,
      currency: transaction.currency,
      transaction_id: transaction.orderId,
    }));
  }
}

export default Glami;
