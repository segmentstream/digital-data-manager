import { Integration } from './../Integration';
import AsyncQueue from './utils/AsyncQueue';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
} from './../events';

const DEVELOPMENT_URL_PREFIX = 'integration';
const PRODUCTION_URL_PREFIX = 'recs';

const PLACEMENT_TYPE_HOME_PAGE = 'home_page';
const PLACEMENT_TYPE_GENERIC_PAGE = 'generic_page';
const PLACEMENT_TYPE_ITEM_PAGE = 'item_page';
const PLACEMENT_TYPE_CATEGORY_PAGE = 'category_page';
const PLACEMENT_TYPE_SEARCH_PAGE = 'search_page';
const PLACEMENT_TYPE_CART_PAGE = 'cart_page';
const PLACEMENT_TYPE_PURCHASE_COMPLETE_PAGE = 'purchase_complete_page';

class RichRelevance extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      apiKey: '',
      useProductionUrl: false,
      sessionIdVar: '',
      placements: {},
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
      ]
    default:
      return [];
    }
  }

  getSemanticEvents() {
    return [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      SEARCHED_PRODUCTS,
      COMPLETED_TRANSACTION,
    ];
  }

  initialize() {
    this.baseUrlSubdomain = (this.getOption('useProductionUrl')) ? PRODUCTION_URL_PREFIX : DEVELOPMENT_URL_PREFIX;
    this.asyncQueue = new AsyncQueue(this.isLoaded);
    this.load(this.onLoad);
  }

  enrichDigitalData() {
    this.asyncQueue.push(() => {
      window.RR.jsonCallback = () => {
        // Place your rendering logic here. Actual code varies depending on your website implementation.
        console.dir(window.RR.data.JSON.placements);
        this.onEnrich();
      };
    });
  }

  isLoaded() {
    return !!(window.RR && window.rr_flush_onload);
  }

  getPlacements(placementType) {
    const placements = (this.getOption('placements') || {})[placementType];
    if (placements) {
      return Object.keys(placements);
    }
    return [];
  }

  addPlacements(placementType) {
    const placements = this.getPlacements(placementType);
    if (placements.length) {
      for (const placementName of placements) {
        window.R3_COMMON.addPlacementType([placementType, placementName].join('.'));
      }
    } else {
      window.R3_COMMON.addPlacementType(placementType);
    }
  }

  rrAddListItems(listing) {
    if (!listing.items) return;

    let i = 0;
    for (const item of listing.items) {
      if (i >= 15) return;
      if (item.id) {
        window.R3_COMMON.addItemId(item.id);
        i += 1;
      }
    }
  }

  rrFlush() {
    window.rr_flush_onload();
    window.r3();
    this.rrFlushed = true;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
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
        window.R3_COMMON.setRegionId(website.currency);
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

      for (const lineItem of lineItems) {
        const product = lineItem.product || {};
        window.R3_CART.addItemId(product.id, product.skuCode);
      }
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

      for (const lineItem of lineItems) {
        const product = lineItem.product || {};
        const quantity = lineItem.quantity || 1;
        window.R3_PURCHASED.addItemIdPriceQuantity(product.id, product.unitSalePrice, quantity, product.skuCode);
      }
      this.rrFlush();
    });
  }
}

export default RichRelevance;
