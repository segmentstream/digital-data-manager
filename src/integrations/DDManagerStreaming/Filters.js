import cleanObject from 'driveback-utils/cleanObject';
import { getProp } from 'driveback-utils/dotProp';
import each from 'driveback-utils/each';
import { warn } from 'driveback-utils/safeConsole';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
  REFUNDED_TRANSACTION,
  VIEWED_CART,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_CHECKOUT_STEP,
  SEARCHED_PRODUCTS,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  VIEWED_EXPERIMENT,
} from './../../events/semanticEvents';

const CUSTOM_TYPE_NUMERIC = 'number';
const CUSTOM_TYPE_STRING = 'string';

export const pageProps = [
  'name',
  'category',
  'type',
  'breadcrumb',
  'url',
  'path',
  'queryString',
  'title',
  'hash',
];

export const websiteProps = [
  'type',
  'region',
  'regionId',
  'language',
  'currency',
  'environment',
];

export const productProps = [
  'id',
  'name',
  'currency',
  'unitSalePrice',
  'unitPrice',
  'category',
  'categoryId',
  'url',
  'imageUrl',
  'thumbnailUrl',
  'manufacturer',
  'skuCode',
  'stock',
  'voucher',
  'color',
  'size',
  'customDimensions',
  'customMetrics',
];

export const listingProps = [
  'listId',
  'listName',
  'categoryId',
  'category',
  'query',
  'resultCount',
  'pagesCount',
  'currentPage',
  'sortBy',
  'layout',
];

const lineItemProps = [
  ...productProps.map(productProp => ['product', productProp].join('.')),
  'quantity',
  'subtotal',
];

export const cartProps = [
  ...lineItemProps.map(lineItemProp => ['lineItems[]', lineItemProp].join('.')),
  'id',
  'total',
  'subtotal',
  'currency',
  'voucher',
  'voucherDiscount',
  'shippingCost',
  'paymentMethod',
];

export const transactionProps = [
  ...lineItemProps.map(lineItemProp => ['lineItems[]', lineItemProp].join('.')),
  'total',
  'subtotal',
  'currency',
  'voucher',
  'voucherDiscount',
  'shippingCost',
  'paymentMethod',
  'orderId',
  'isFirst',
];

export const campaignProps = [
  'id',
  'name',
  'category',
  'subcategory',
  'design',
  'position',
];

export const listItemProps = [
  ...productProps.map(productProp => ['product', productProp].join('.')),
  'position',
  'listId',
];

function extractCustoms(source, variableMapping, type) {
  const values = [];
  each(variableMapping, (key, sourceProp) => {
    let value = getProp(source, sourceProp);
    if (value !== undefined) {
      if (type === CUSTOM_TYPE_NUMERIC && typeof value !== 'number') {
        value = Number(value);
      } else if (type === CUSTOM_TYPE_STRING && typeof value !== 'string') {
        value = value.toString();
      }
      values.push({
        name: key,
        value,
      });
    }
  });
  return values;
}

const filterObject = (obj, propsSet, restrictedProps = []) => {
  const filteredObject = {};
  propsSet.forEach((prop) => {
    if (obj[prop] !== undefined && restrictedProps.indexOf(prop) < 0) {
      filteredObject[prop] = obj[prop];
    }
  });
  return filteredObject;
};

class Filters {
  constructor(dimensions, metrics, productDimensions, productMetrics) {
    this.dimensions = dimensions;
    this.metrics = metrics;
    this.productDimensions = productDimensions;
    this.productMetrics = productMetrics;
  }

  filterEventHit(event) {
    const mapping = {
      [VIEWED_PAGE]: this.filterViewedPage.bind(this),
      [VIEWED_PRODUCT_DETAIL]: this.filterViewedProductDetail.bind(this),
      [ADDED_PRODUCT]: this.filterAddedProduct.bind(this),
      [REMOVED_PRODUCT]: this.filterRemovedProduct.bind(this),
      [VIEWED_CART]: this.filterViewedCart.bind(this),
      [COMPLETED_TRANSACTION]: this.filterCompletedTransaction.bind(this),
      [REFUNDED_TRANSACTION]: this.filterRefundedTransaction.bind(this),
      [VIEWED_CHECKOUT_STEP]: this.filterViewedCheckoutStep.bind(this),
      [COMPLETED_CHECKOUT_STEP]: this.filterCompeltedCheckoutStep.bind(this),
      [VIEWED_PRODUCT_LISTING]: this.filterViewedProductListing.bind(this),
      [SEARCHED_PRODUCTS]: this.filterSearchedProducts.bind(this),
      [VIEWED_CAMPAIGN]: this.filterViewedCampaign.bind(this),
      [CLICKED_CAMPAIGN]: this.filterClickedCampaign.bind(this),
      [VIEWED_PRODUCT]: this.filterViewedProduct.bind(this),
      [CLICKED_PRODUCT]: this.filterClickedProduct.bind(this),
      [VIEWED_EXPERIMENT]: this.filterViewedExperiment.bind(this),
    };

    if (event.name && mapping[event.name]) {
      return mapping[event.name](event);
    }
    return this.filterCommonEvent(event);
  }

  filterProduct(product = {}) {
    const customDimensions = extractCustoms(product, this.productDimensions, CUSTOM_TYPE_STRING);
    const customMetrics = extractCustoms(product, this.productMetrics, CUSTOM_TYPE_NUMERIC);

    let category = product.category;
    if (category) {
      if (Array.isArray(category)) {
        category = category.join('/');
      } else if (typeof category === 'object') {
        category = Object.values(category).join('/');
      } else {
        category = String(category);
      }
    }

    return filterObject(
      {
        ...product,
        id: (product.id) ? String(product.id) : undefined,
        skuCode: (product.skuCode) ? String(product.skuCode) : undefined,
        categoryId: (product.categoryId) ? String(product.categoryId) : undefined,
        category,
        size: (product.size) ? String(product.size) : undefined,
        unitPrice: (product.unitPrice) ? Number(product.unitPrice) : undefined,
        unitSalePrice: (product.unitSalePrice) ? Number(product.unitSalePrice) : undefined,
        manufacturer: (product.manufacturer) ? product.manufacturer : product.brand,
        imageUrl: (typeof product.imageUrl === 'string') ? product.imageUrl : undefined,
        url: (typeof product.url === 'string') ? product.url : undefined,
        customDimensions,
        customMetrics,
      },
      productProps,
    );
  }

  filterListing(listing = {}) {
    return filterObject({
      ...listing,
      categoryId: (listing.categoryId) ? String(listing.categoryId) : undefined,
      category: (listing.category && Array.isArray(listing.category)) ?
        listing.category.join('/') : String(listing.category),
    }, listingProps);
  }

  filterLineItems(lineItems = []) {
    return lineItems.map(lineItem => cleanObject({
      product: this.filterProduct(lineItem.product),
      quantity: !isNaN(Number(lineItem.quantity)) ? Number(lineItem.quantity) : 1,
      subtotal: !isNaN(Number(lineItem.subtotal)) ? Number(lineItem.subtotal) : undefined,
    }));
  }

  filterListItems(listItems = []) {
    return listItems.map(listItem => cleanObject({
      product: this.filterProduct(listItem.product),
      position: listItem.position !== undefined ? Number(listItem.position) : undefined,
      listId: listItem.listId ? String(listItem.listId) : undefined,
    }));
  }

  filterCampaigns(campaigns = []) {
    return campaigns.map(campaign => filterObject({
      ...campaign,
      position: campaign.position !== undefined ? String(campaign.position) : undefined,
    }, campaignProps));
  }

  filterCart(cart = {}) {
    return filterObject({
      ...cart,
      id: (cart.id) ? String(cart.id) : undefined,
      voucher: Array.isArray(cart.vouchers) ? cart.vouchers.toString() : undefined,
    }, cartProps);
  }

  filterTransaction(transaction = {}) {
    return filterObject({
      ...transaction,
      isFirst: typeof isFirst === 'boolean' ? transaction.isFirst : undefined,
      orderId: transaction.orderId ? String(transaction.orderId) : undefined,
      voucher: Array.isArray(transaction.vouchers) ? transaction.vouchers.toString() : undefined,
    }, transactionProps);
  }

  filterPage(page = {}) {
    let url = page.url;
    let queryString = page.queryString;
    try { url = (url) ? decodeURI(url) : undefined; } catch (e) { warn(e); }
    try { queryString = (queryString) ? decodeURI(queryString) : undefined; } catch (e) { warn(e); }
    return filterObject({
      type: (page.type) ? String(page.type) : undefined,
      name: (page.name) ? String(page.name) : undefined,
      category: (page.category) ? String(page.category) : undefined,
      breadcrumb: (page.breadcrumb && Array.isArray(page.breadcrumb)) ?
        page.breadcrumb.join('/') : page.breadcrumb,
      url,
      path: (page.path) ? String(page.path) : undefined,
      queryString,
      hash: (page.hash) ? page.hash : undefined,
      title: (page.title) ? page.title : undefined,
    }, pageProps);
  }

  filterWebsite(website = {}) {
    return filterObject({
      ...website,
      regionId: website.regionId ? String(website.regionId) : undefined,
    }, websiteProps);
  }

  filterExperiment(experiment = {}) {
    return cleanObject({
      id: experiment.id,
      name: experiment.name,
      variantId: (experiment.variationId !== undefined) ?
        String(experiment.variationId) : undefined,
      variantName: experiment.variationName,
    });
  }

  filterViewedPage(event) {
    const filtered = this.filterCommonEvent(event);
    return {
      ...filtered,
      page: this.filterPage(event.page),
    };
  }

  filterViewedProductDetail(event) {
    const filtered = this.filterCommonEvent(event);
    const product = this.filterProduct(event.product);
    return { ...filtered, product };
  }

  filterAddedProduct(event) {
    const filtered = this.filterCommonEvent(event);
    const quantity = Number(event.quantity);
    return {
      ...filtered,
      product: this.filterProduct(event.product),
      quantity: !isNaN(quantity) ? quantity : 1,
    };
  }

  filterRemovedProduct(event) {
    return this.filterAddedProduct(event);
  }

  filterAddedProductToWishlist(event) {
    return this.filterAddedProduct(event);
  }

  filterRemovedProductFromWishlist(event) {
    return this.filterAddedProduct(event);
  }

  filterViewedCheckoutStep(event) {
    const filtered = this.filterCommonEvent(event);
    const step = Number(event.step);
    return {
      ...filtered,
      step: !isNaN(step) ? step : undefined,
    };
  }

  filterCompeltedCheckoutStep(event) {
    return this.filterViewedCheckoutStep(event);
  }

  filterViewedCart(event) {
    const filtered = this.filterCommonEvent(event);
    const cart = this.filterCart(event.cart);
    cart.lineItems = this.filterLineItems(getProp(event, 'cart.lineItems'));
    return {
      ...filtered,
      cart,
    };
  }

  filterCompletedTransaction(event) {
    const filtered = this.filterCommonEvent(event);
    const transaction = this.filterTransaction(event.transaction);
    transaction.lineItems = this.filterLineItems(getProp(event, 'transaction.lineItems'));
    return {
      ...filtered,
      transaction,
    };
  }

  filterRefundedTransaction(event) {
    return this.filterCompletedTransaction(event);
  }

  filterViewedProductListing(event) {
    const filtered = this.filterCommonEvent(event);
    const listing = this.filterListing(event.listing);
    return {
      ...filtered,
      listing,
    };
  }

  filterSearchedProducts(event) {
    return this.filterViewedProductListing(event);
  }

  filterViewedCampaign(event) {
    const filtered = this.filterCommonEvent(event);
    let campaigns;
    if (event.campaign) {
      campaigns = [event.campaign];
    } else if (event.campaigns) {
      campaigns = event.campaigns;
    }

    if (campaigns) {
      return {
        ...filtered,
        campaigns: this.filterCampaigns(campaigns),
      };
    }

    return filtered;
  }

  filterViewedProduct(event) {
    const filtered = this.filterCommonEvent(event);
    let listItems;
    if (event.listItem) {
      listItems = [event.listItem];
    } else if (event.listItems) {
      listItems = event.listItems;
    }

    if (listItems) {
      return {
        ...filtered,
        listItems: this.filterListItems(listItems),
      };
    }
    return filtered;
  }

  filterClickedProduct(event) {
    return this.filterViewedProduct(event);
  }

  filterClickedCampaign(event) {
    return this.filterViewedCampaign(event);
  }

  filterViewedExperiment(event) {
    const filtered = this.filterCommonEvent(event);
    const experiment = this.filterExperiment(event.experiment);
    return {
      ...filtered,
      experiment,
    };
  }

  filterCommonEvent(event) {
    const customDimensions = extractCustoms(event, this.dimensions, CUSTOM_TYPE_STRING);
    const customMetrics = extractCustoms(event, this.metrics, CUSTOM_TYPE_NUMERIC);

    if (customDimensions.length) event.customDimensions = customDimensions;
    if (customMetrics.length) event.customMetrics = customMetrics;

    return cleanObject({
      name: (event.name) ? String(event.name) : undefined,
      category: (event.category) ? String(event.category) : undefined,
      label: (event.label) ? String(event.label) : undefined,
      customDimensions: event.customDimensions,
      customMetrics: event.customMetrics,
    });
  }
}

export default Filters;
