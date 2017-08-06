import Integration from './../Integration';
import { getProp } from 'driveback-utils/dotProp';
import AsyncQueue from './utils/AsyncQueue';
import cleanObject from 'driveback-utils/cleanObject';
import deleteProperty from 'driveback-utils/deleteProperty';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const DEVELOPMENT_URL_PREFIX = 'integration';
const PRODUCTION_URL_PREFIX = 'recs';

const PLACEMENT_TYPE_HOME_PAGE = 'home_page';
const PLACEMENT_TYPE_GENERIC_PAGE = 'generic_page';
const PLACEMENT_TYPE_ITEM_PAGE = 'item_page';
const PLACEMENT_TYPE_ADD_TO_CART_PAGE = 'add_to_cart_page';
const PLACEMENT_TYPE_CATEGORY_PAGE = 'category_page';
const PLACEMENT_TYPE_SEARCH_PAGE = 'search_page';
const PLACEMENT_TYPE_CART_PAGE = 'cart_page';
const PLACEMENT_TYPE_PURCHASE_COMPLETE_PAGE = 'purchase_complete_page';

function mapItem(item) {
  return cleanObject({
    id: item.id,
    name: item.name,
    imageUrl: item.imageURL,
    url: item.linkURL,
    unitSalePrice: Number(item.price.replace(/[^0-9.]/g, '')),
    manufacturer: item.brand,
  });
}

class RichRelevance extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      apiKey: '',
      useProductionUrl: false,
      sessionIdVar: '',
      placements: [],
    }, options);
    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//media.richrelevance.com/rrserver/js/1.2/p13n.js',
      },
    });
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PAGE:
        return [
          'page.type',
          'user.userId',
          'website.currency',
          'website.regionId',
          this.getOption('sessionIdVar'),
        ];
      case VIEWED_PRODUCT_DETAIL:
        return [
          'product',
        ];
      case VIEWED_PRODUCT_LISTING:
      case SEARCHED_PRODUCTS:
        return [
          'listing',
        ];
      case VIEWED_CART:
        return [
          'cart',
        ];
      case COMPLETED_TRANSACTION:
        return [
          'transaction',
        ];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: ['page.type', this.getOption('sessionIdVar')],
        validations: {
          'page.type': {
            errors: ['required', 'string'],
          },
          [this.getOption('sessionIdVar')]: {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId', 'listing.category'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'listing.category': {
            errors: ['array'],
            warnings: ['required'],
          },
        },
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.query'],
        validations: {
          'listing.query': {
            errors: ['required', 'string'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id', 'product.name', 'product.categoryId'],
        validation: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            errors: ['required', 'string'],
          },
          'product.categoryId': {
            warnings: ['required', 'string'],
          },
        },
      },
      [ADDED_PRODUCT]: {
        fields: ['product.id', 'product.skuCode'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.skuCode': {
            warnings: ['required', 'string'],
          },
        },
      },
      [VIEWED_CART]: {
        fields: [
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.skuCode',
        ],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'cart.lineItems[].product.skuCode': {
            warnings: ['required', 'string'],
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
        ],
        validation: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.skuCode': {
            warnings: ['required', 'string'],
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

  getSemanticEvents() {
    return [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      VIEWED_PRODUCT_LISTING,
      SEARCHED_PRODUCTS,
      VIEWED_CART,
      COMPLETED_TRANSACTION,
    ];
  }

  initialize() {
    this.baseUrlSubdomain = (this.getOption('useProductionUrl')) ? PRODUCTION_URL_PREFIX : DEVELOPMENT_URL_PREFIX;
    this.asyncQueue = new AsyncQueue(this.isLoaded);
    this.enrichDigitalData();
  }

  enrichDigitalData() {
    this.asyncQueue.push(() => {
      window.RR.jsonCallback = () => {
        const placements = getProp(window, 'RR.data.JSON.placements');
        if (!placements || !placements.length) {
          this.onEnrich();
          return;
        }
        let recommendation
          = this.digitalData.recommendation = this.digitalData.recommendation || [];
        if (!Array.isArray(recommendation)) {
          recommendation = [recommendation];
        }

        placements.forEach((placement) => {
          recommendation.push({
            listId: placement.placement_name,
            listName: placement.message,
            strategy: placement.strategy,
            items: placement.items.map(mapItem),
          });
          this.digitalData.changes.push(
            ['recommendation', recommendation, `${this.getName()} Integration`],
          );
        });

        this.onEnrich();
      };
    });
  }

  isLoaded() {
    return !!(window.RR && window.rr_flush_onload);
  }

  getPlacements(placementType) {
    const placements = this.getOption('placements');
    if (placements) {
      return placements.filter(placementName => placementName.indexOf(`${placementType}.`) === 0);
    }
    return [];
  }

  addPlacements(placementType) {
    const placements = this.getPlacements(placementType);
    if (placements.length) {
      placements.forEach((placementName) => {
        window.R3_COMMON.addPlacementType(placementName);
      });
    } else {
      window.R3_COMMON.addPlacementType(placementType);
    }
  }

  rrAddListItems(listing) {
    if (!listing.items) return;

    let i = 0;
    listing.items.forEach((item) => {
      if (i >= 15) return;
      if (item.id) {
        window.R3_COMMON.addItemId(item.id);
        i += 1;
      }
    });
  }

  rrResetContext() {
    if (window.R3_ITEM !== undefined) {
      deleteProperty(window, 'R3_ITEM');
    }
    if (window.R3_COMMON.placementTypes) {
      deleteProperty(window.R3_COMMON, 'placementTypes');
    }
    if (window.R3_COMMON.categoryHintIds) {
      deleteProperty(window.R3_COMMON, 'categoryHintIds');
    }
  }

  rrFlush() {
    if (!this.rrFlushed) {
      window.rr_flush_onload();
    }
    window.r3();
    this.rrFlushed = true;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      if (this.rrFlushed) {
        this.rrResetContext();
      }
      this[method](event);
    }
  }

  onViewedPage(event) {
    this.rrFlushed = false;

    const page = event.page || {};
    const user = event.user || {};
    const website = event.website || {};
    const sessionId = getProp(event, this.getOption('sessionIdVar'));
    this.asyncQueue.push(() => {
      window.R3_COMMON = new r3_common(); // eslint-disable-line
      window.R3_COMMON.setApiKey(this.getOption('apiKey'));
      window.R3_COMMON.setBaseUrl(`${window.location.protocol}//${this.baseUrlSubdomain}.richrelevance.com/rrserver/`);
      window.R3_COMMON.setClickthruServer(`${window.location.protocol}//${window.location.host}`);
      window.R3_COMMON.setSessionId(sessionId);
      if (user.userId) {
        window.R3_COMMON.setUserId(user.userId);
      }
      if (website.regionId) {
        window.R3_COMMON.setRegionId(website.regionId);
      }
      if (website.currency) {
        window.R3_COMMON.setCurrency(website.currency);
      }
      setTimeout(() => {
        if (!this.rrFlushed) {
          this.rrFlush();
        }
      }, 100);
    });

    if (page.type === 'home') {
      this.onViewedHome(event);
    }
  }

  onViewedHome() {
    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_HOME_PAGE);

      window.R3_HOME = new window.r3_home(); // eslint-disable-line

      this.rrFlush();
    });
  }

  onViewedGenericPage() {
    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_GENERIC_PAGE);

      window.R3_GENERIC = new window.r3_generic(); // eslint-disable-line

      this.rrFlush();
    });
  }

  onViewedProductDetail(event) {
    const product = event.product || {};

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_ITEM_PAGE);

      if (product.categoryId) {
        window.R3_COMMON.addCategoryHintId(product.categoryId);
      }

      window.R3_ITEM = new window.r3_item(); // eslint-disable-line
      window.R3_ITEM.setId(product.id);
      window.R3_ITEM.setName(product.name);
      this.rrFlush();
    });
  }

  onAddedProduct(event) {
    const product = event.product || {};

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_ADD_TO_CART_PAGE);

      window.R3_ADDTOCART = new window.r3_addtocart(); // eslint-disable-line
      window.R3_ADDTOCART.addItemIdToCart(product.id, product.skuCode);

      this.rrFlush();
    });
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    if (!listing.categoryId) return;

    listing.items = listing.items || [];

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_CATEGORY_PAGE);

      window.R3_CATEGORY = new r3_category(); // eslint-disable-line
      window.R3_CATEGORY.setId(listing.categoryId);
      if (listing.category && listing.category.length) {
        const categoryName = listing.category[listing.category.length - 1];
        window.R3_CATEGORY.setName(categoryName);
      }

      this.rrAddListItems(listing);
      this.rrFlush();
    });
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    if (!listing.query) return;

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_SEARCH_PAGE);

      window.R3_SEARCH = new r3_search(); // eslint-disable-line
      window.R3_SEARCH.setTerms(listing.query);

      this.rrAddListItems(listing);
      this.rrFlush();
    });
  }

  onViewedCart(event) {
    const cart = event.cart;
    if (!cart) return;
    const lineItems = cart.lineItems || [];

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_CART_PAGE);

      window.R3_CART = new window.r3_cart(); // eslint-disable-line

      lineItems.forEach((lineItem) => {
        const product = lineItem.product || {};
        window.R3_CART.addItemId(product.id, product.skuCode);
      });

      this.rrFlush();
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction || !transaction.orderId) return;
    const lineItems = transaction.lineItems || [];

    this.asyncQueue.push(() => {
      this.addPlacements(PLACEMENT_TYPE_PURCHASE_COMPLETE_PAGE);

      window.R3_PURCHASED = new window.r3_purchased(); // eslint-disable-line
      window.R3_PURCHASED.setOrderNumber(transaction.orderId);

      lineItems.forEach((lineItem) => {
        const product = lineItem.product || {};
        const quantity = lineItem.quantity || 1;
        window.R3_PURCHASED.addItemIdPriceQuantity(
          product.id, product.unitSalePrice, quantity, product.skuCode,
        );
      });
      this.rrFlush();
    });
  }
}

export default RichRelevance;
