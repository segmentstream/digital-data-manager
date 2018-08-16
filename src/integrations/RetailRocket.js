import deleteProperty from 'driveback-utils/deleteProperty';
import noop from 'driveback-utils/noop';
import { getProp } from 'driveback-utils/dotProp';
import getVarValue from 'driveback-utils/getVarValue';
import each from 'driveback-utils/each';
import Integration from '../Integration';
import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from '../IntegrationUtils';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  CLICKED_PRODUCT,
  ADDED_PRODUCT,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
} from '../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  CLICKED_PRODUCT,
  ADDED_PRODUCT,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
];

class RetailRocket extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      partnerId: '',
      userIdProperty: 'user.userId',
      trackProducts: true, // legacy setting, use noConflict instead
      noConflict: false,
      trackAllEmails: false,
      useGroupView: false,
      listMethods: {},
      customVariables: {},
      productVariables: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    // legacy setting mapper
    if (this.getOption('trackProducts') === false) {
      this.setOption('noConflict', true);
    }

    this.addTag({
      type: 'script',
      attr: {
        id: 'rrApi-jssdk',
        src: '//cdn.retailrocket.ru/content/javascript/tracking.js',
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case SUBSCRIBED:
        enrichableProps = [
          ...getEnrichableVariableMappingProps(this.getOption('customVariables')),
        ];
        break;
      case VIEWED_PAGE:
        enrichableProps = [
          ...getEnrichableVariableMappingProps(this.getOption('customVariables')),
          'user.email',
          'user.isSubscribed',
        ];
        break;
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          ...getEnrichableVariableMappingProps(this.getOption('productVariables')),
          'product',
        ];
        break;
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          'listing.categoryId',
        ];
        break;
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'listing.query',
        ];
        break;
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'transaction',
        ];
        break;
      case ADDED_PRODUCT:
        enrichableProps = [
          ...getEnrichableVariableMappingProps(this.getOption('productVariables')),
        ];
        break;
      default:
    }

    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: ['user.email', 'user.isSubscribed'],
        validations: {
          'user.email': {
            warnings: ['string'],
          },
          'user.isSubscribed': {
            warnings: ['boolean'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.skuCode',
          'product.variations[].skuCode',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [ADDED_PRODUCT]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.query'],
        validations: {
          'listing.query': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
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
            errors: ['required'],
            warnings: ['numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  initialize() {
    window.rrPartnerId = this.getOption('partnerId');
    const userId = getProp(this.digitalData, this.getOption('userIdProperty'));
    if (userId) {
      window.rrPartnerUserId = userId;
    }

    window.rrApiOnReady = window.rrApiOnReady || [];
    window.rrApi = {};
    'pageView addToBasket order categoryView setEmail view groupView recomMouseDown recomAddToCart search'
      .split(/\s+/).forEach((m) => { window.rrApi[m] = noop; });
  }

  isLoaded() {
    return !!(window.rrApi && typeof window.rrApi._initialize === 'function');
  }

  reset() {
    deleteProperty(window, 'rrPartnerId');
    deleteProperty(window, 'rrApi');
    deleteProperty(window, 'rrApiOnReady');
    deleteProperty(window, 'rrApi');
    deleteProperty(window, 'retailrocket');
    deleteProperty(window, 'retailrocket_products');
    deleteProperty(window, 'rrLibrary');
    const script = document.getElementById('rrApi-jssdk');
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  trackEvent(event) {
    if (this.getOption('noConflict') !== true) {
      if (event.name === VIEWED_PAGE) {
        this.onViewedPage(event);
      } else if (event.name === VIEWED_PRODUCT_LISTING) {
        this.onViewedProductCategory(event.listing);
      } else if (event.name === ADDED_PRODUCT) {
        this.onAddedProduct(event);
      } else if (event.name === VIEWED_PRODUCT_DETAIL) {
        this.onViewedProductDetail(event);
      } else if (event.name === CLICKED_PRODUCT) {
        this.onClickedProduct(event.listItem);
      } else if (event.name === COMPLETED_TRANSACTION) {
        this.onCompletedTransaction(event);
      } else if (event.name === SUBSCRIBED) {
        this.onSubscribed(event);
      } else if (event.name === SEARCHED_PRODUCTS) {
        this.onSearched(event.listing);
      }
    } else if (event.name === SUBSCRIBED) {
      this.onSubscribed(event);
    }
  }

  onViewedPage(event) {
    const { user } = event;
    if (user && user.email) {
      if (this.getOption('trackAllEmails') === true || user.isSubscribed === true) {
        this.onSubscribed(event);
      }
    }
  }

  onViewedProductCategory(listing) {
    const { categoryId } = listing || {};
    if (!categoryId) return;

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.categoryView(categoryId);
      } catch (e) {
        // do nothing
      }
    });
  }

  onViewedProductDetail(event) {
    const { product } = event;
    const productId = this.getProductId(product);
    if (!productId) return;

    const productVariables = this.getProductVariables(event);

    window.rrApiOnReady.push(() => {
      try {
        if (!this.getOption('useGroupView')) {
          window.rrApi.view(productId, productVariables);
        } else {
          const variations = product.variations || [];
          let skuCodes;
          if (variations.length) {
            skuCodes = variations.map(variation => variation.skuCode);
          } else {
            skuCodes = [product.skuCode];
          }
          window.rrApi.groupView(skuCodes, productVariables);
        }
      } catch (e) {
        // do nothing
      }
    });
  }

  onAddedProduct(event) {
    const { product } = event;
    const productId = this.getProductId(product);
    if (!productId) return;

    const productVariables = this.getProductVariables(event);

    window.rrApiOnReady.push(() => {
      try {
        if (!this.getOption('useGroupView')) {
          window.rrApi.addToBasket(productId, productVariables);
        } else {
          window.rrApi.addToBasket(product.skuCode, productVariables);
        }
      } catch (e) {
        // do nothing
      }
    });
  }

  onClickedProduct(listItem) {
    if (!listItem) return;

    const productId = this.getProductId(listItem.product);
    if (!productId) return;

    const { listId } = listItem;
    if (!listId) return;

    const methodName = this.getOption('listMethods')[listId];
    if (!methodName) return;

    window.rrApiOnReady.push(() => {
      try {
        if (!this.getOption('useGroupView')) {
          window.rrApi.recomMouseDown(productId, methodName);
        } else {
          window.rrApi.recomMouseDown(listItem.product.skuCode, methodName);
        }
      } catch (e) {
        // do nothing
      }
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};

    if (!this.validateTransaction(transaction)) return;

    if (this.getOption('trackAllEmails') === true) {
      this.onSubscribed(event);
    }

    const { lineItems } = transaction;
    if (!lineItems.every(lineItem => this.validateTransactionLineItem(lineItem))) return;

    const items = lineItems.map((lineItem) => {
      const { product } = lineItem;
      return {
        id: (!this.getOption('useGroupView')) ? product.id : product.skuCode,
        qnt: lineItem.quantity,
        price: product.unitSalePrice || product.unitPrice,
      };
    });

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.order({
          transaction: transaction.orderId,
          items,
        });
      } catch (e) {
        // do nothing
      }
    });
  }

  onSubscribed(event) {
    const user = event.user || {};
    if (!user.email) return;


    const rrCustoms = {};
    const settings = this.getOption('customVariables');
    each(settings, (key, variable) => {
      let rrCustom;
      if (typeof variable === 'string') { // TODO: remove backward compatibility in later versions
        rrCustom = getProp(event, variable);
      } else {
        rrCustom = getVarValue(variable, event);
      }
      if (rrCustom !== undefined) {
        if (typeof rrCustom === 'boolean') rrCustom = rrCustom.toString();
        rrCustoms[key] = rrCustom;
      }
    });

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.setEmail(user.email, rrCustoms);
      } catch (e) {
        // do nothing
      }
    });
  }

  onSearched(listing) {
    listing = listing || {};
    if (!listing.query) return;

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.search(listing.query);
      } catch (e) {
        // do nothing
      }
    });
  }

  validateTransaction(transaction) {
    if (!transaction.orderId) {
      return false;
    }

    const { lineItems } = transaction;
    return !(!lineItems || !Array.isArray(lineItems) || lineItems.length === 0);
  }

  validateLineItem(lineItem) {
    return !!lineItem.product;
  }

  validateTransactionLineItem(lineItem) {
    if (!this.validateLineItem(lineItem)) return false;

    const { product } = lineItem;
    return !!(product.id
      && (product.unitSalePrice || product.unitPrice)
      && lineItem.quantity);
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

  getProductId(product) {
    const { id } = product || {};

    return id;
  }
}

export default RetailRocket;
