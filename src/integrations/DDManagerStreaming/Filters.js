import cleanObject from 'driveback-utils/cleanObject';
import { getProp } from 'driveback-utils/dotProp';
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
} from './../../events/semanticEvents';

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

export const cartProps = [
  'id',
  'vouchers',
  'lineItems',
  'total',
  'subtotal',
  'currency',
  'voucherDiscount',
  'shippingCost',
  'paymentMethod',
];

export const transactionProps = [
  'vouchers',
  'lineItems',
  'total',
  'subtotal',
  'currency',
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

const filterObject = (obj, propsSet, restrictedProps = []) => {
  const filteredObject = {};
  propsSet.forEach((prop) => {
    if (obj[prop] !== undefined && restrictedProps.indexOf(prop) < 0) {
      filteredObject[prop] = obj[prop];
    }
  });
  return filteredObject;
};

const fitlerObjectsArray = (objArray, propSets, restrictedProps) =>
  objArray.map(obj => filterObject(obj, propSets, restrictedProps));


class Filters {
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
    };

    if (event.name && mapping[event.name]) {
      return mapping[event.name](event);
    }
    return this.filterCommonEvent(event);
  }

  filterProduct(product = {}) {
    return filterObject(
      {
        ...product,
        id: (product.id) ? String(product.id) : undefined,
        categoryId: (product.categoryId) ? String(product.categoryId) : undefined,
        category: (product.category && Array.isArray(product.category)) ?
          product.category.join('/') : product.category,
        unitPrice: (product.unitPrice) ? Number(product.unitPrice) : undefined,
        unitSalePrice: (product.unitSalePrice) ? Number(product.unitSalePrice) : undefined,
      },
      productProps,
    );
  }

  filterListing(listing = {}) {
    return filterObject({
      ...listing,
      categoryId: (listing.categoryId) ? String(listing.categoryId) : undefined,
      category: (listing.category && Array.isArray(listing.category)) ?
        listing.category.join('/') : listing.category,
    }, listingProps);
  }

  filterLineItems(lineItems = []) {
    return lineItems.map(lineItem => cleanObject({
      product: this.filterProduct(lineItem.product),
      quantity: lineItem.quantity,
      subtotal: lineItem.subtotal,
    }));
  }

  filterTransaction(transaction = {}) {
    return filterObject({
      ...transaction,
      orderId: transaction.orderId ? String(transaction.orderId) : undefined,
    }, transactionProps);
  }

  filterPage(page = {}) {
    return filterObject({
      ...page,
      breadcrumb: (page.breadcrumb && Array.isArray(page.breadcrumb)) ?
        page.breadcrumb.join('/') : page.breadcrumb,
    }, pageProps);
  }

  filterWebsite(website = {}) {
    return filterObject({
      ...website,
      regionId: website.regionId ? String(website.regionId) : undefined,
    }, websiteProps);
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
    return {
      ...filtered,
      product: this.filterProduct(event.product),
      quantity: event.quantity || 1,
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
    return {
      ...filtered,
      step: event.step,
    };
  }

  filterCompeltedCheckoutStep(event) {
    return this.filterViewedCheckoutStep(event);
  }

  filterViewedCart(event) {
    const filtered = this.filterCommonEvent(event);
    const cart = filterObject(event.cart, cartProps);
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
        campaigns: fitlerObjectsArray(campaigns, campaignProps),
      };
    }

    return filtered;
  }

  filterClickedCampaign(event) {
    return this.filterViewedCampaign(event);
  }

  filterCommonEvent(event) {
    return cleanObject({
      name: event.name,
      category: event.category,
      label: event.label,
      customDimensions: event.customDimensions,
      customMetrics: event.customMetrics,
    });
  }
}

export default Filters;
