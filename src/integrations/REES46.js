import cleanObject from 'driveback-utils/cleanObject';
import { getProp } from 'driveback-utils/dotProp';
import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from '../IntegrationUtils';

import Integration from '../Integration';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
  SEARCHED_PRODUCTS,
} from '../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
  SEARCHED_PRODUCTS,
];

class REES46 extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      storeKey: '',
      feedWithGroupedProducts: false,
      productVariables: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://cdn.rees46.com/v3.js',
      },
    });
  }

  initialize() {
    window.r46 = window.r46 || function r46Init() {
      (window.r46.q = window.r46.q || []).push(arguments);
    };
    window.r46('init', this.getOption('storeKey'));
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PAGE: return ['user', 'website'];
      case VIEWED_PRODUCT_LISTING: return ['listing.categoryId'];
      case SEARCHED_PRODUCTS: return ['listing.query'];
      case COMPLETED_TRANSACTION: return ['transaction'];
      case VIEWED_PRODUCT_DETAIL:
        return [
          ...getEnrichableVariableMappingProps(this.getOption('productVariables')),
          'product',
        ];
      default: return [];
    }
  }

  getProductVariables(event) {
    const { product } = event;
    const mapping = this.getOption('productVariables');
    return extractVariableMappingValues(
      { event, product },
      mapping,
      { multipleScopes: true },
    );
  }

  trackEvent(event) {
    const eventMap = {
      [VIEWED_PAGE]: this.onViewedPage.bind(this),
      [VIEWED_PRODUCT_DETAIL]: this.onViewedProductDetail.bind(this),
      [VIEWED_PRODUCT_LISTING]: this.onViewedProductListing.bind(this),
      [SEARCHED_PRODUCTS]: this.onSearchedProducts.bind(this),
      [ADDED_PRODUCT]: this.onAddedProduct.bind(this),
      [REMOVED_PRODUCT]: this.onRemovedProduct.bind(this),
      [COMPLETED_TRANSACTION]: this.onCompletedTransaction.bind(this),
    };
    if (eventMap[event.name]) {
      eventMap[event.name](event);
    }
  }

  onViewedPage(event) {
    const { user } = event;
    if (!user || !user.userId || !user.email) return;
    const gender = String(user.gender).toLowerCase();

    const rees46Data = cleanObject({
      id: user.userId,
      email: user.email,
      gender: ['m', 'f'].indexOf(gender) >= 0 ? gender : undefined,
      birthday: user.birthDate,
      location: getProp(event, 'website.regionId'),
    });

    window.r46('profile', 'set', rees46Data);
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productId = (feedWithGroupedProducts) ? product.skuCode : product.id;
    if (!productId) return;

    const productVariables = this.getProductVariables(event);
    const { stock } = product;
    if (stock !== undefined) {
      productVariables.stock = (stock > 0);
    }

    if (Object.keys(productVariables).length > 0) {
      window.r46('track', 'view', {
        id: productId,
        ...productVariables,
      });
    } else {
      window.r46('track', 'view', productId);
    }
  }

  onAddedProduct(event) {
    const product = event.product || {};
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productId = (feedWithGroupedProducts) ? product.skuCode : product.id;
    if (productId) {
      window.r46('track', 'cart', {
        id: productId,
        amount: event.quantity || 1,
      });
    }
  }

  onRemovedProduct(event) {
    const product = event.product || {};
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productId = (feedWithGroupedProducts) ? product.skuCode : product.id;
    if (productId) {
      window.r46('track', 'remove_from_cart', productId);
    }
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const { categoryId } = listing;
    if (categoryId) {
      window.r46('track', 'category', categoryId);
    }
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    const { query } = listing;
    if (query) {
      window.r46('track', 'search', query);
    }
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const lineItems = transaction.lineItems || [];
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    if (lineItems.length) {
      window.r46('track', 'purchase', {
        products: lineItems.map(lineItem => ({
          id: (feedWithGroupedProducts)
            ? getProp(lineItem, 'product.skuCode') : getProp(lineItem, 'product.id'),
          price: getProp(lineItem, 'product.unitSalePrice'),
          amount: lineItem.quantity || 1,
        })),
        order: transaction.orderId,
        order_price: transaction.total,
      });
    }
  }
}

export default REES46;
