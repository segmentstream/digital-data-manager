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

const userProps = [
  'isLoggedIn',
  'isReturning',
  'isSubscribed',
  'hasTransacted',
  'lastTransactionDate',
];

const pageProps = [
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

const productProps = [
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

const listingProps = [
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

const cartProps = [
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

const transactionProps = [
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

const campaignProps = [
  'id',
  'name',
  'category',
  'subcategory',
  'design',
  'position',
];

const filterObject = (obj, propSets, restrictedProps = []) => {
  const filteredObject = {};
  propSets.forEach((propsSet) => {
    propsSet.forEach((prop) => {
      if (obj[prop] !== undefined && restrictedProps.indexOf(prop) < 0) {
        filteredObject[prop] = obj[prop];
      }
    });
  });
  return filteredObject;
};

const fitlerObjectsArray = (objArray, propSets, restrictedProps) =>
  objArray.map(obj => filterObject(obj, propSets, restrictedProps));


class Filters {
  constructor(customUserProps = [], customProductProps = []) {
    this.customUserProps = customUserProps;
    this.customProductProps = customProductProps;
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
    };

    if (event.name && mapping[event.name]) {
      return mapping[event.name](event);
    }
    return this.filterCommonEvent(event);
  }

  filterUser(user) {
    const fitlered = filterObject(user, [userProps, this.customUserProps], [
      'anonymousId',
      'userId',
      'firstName',
      'lastName',
      'fullName',
      'phone',
      'email',
    ]);

    return fitlered;
  }

  filterProduct(product = {}) {
    return filterObject(product, [productProps, this.customProductProps]);
  }

  filterLineItems(lineItems = []) {
    return lineItems.map(lineItem => cleanObject({
      product: this.filterProduct(lineItem.product),
      quantity: lineItem.quantity,
      subtotal: lineItem.subtotal,
    }));
  }

  filterViewedPage(event) {
    const filtered = this.filterCommonEvent(event);
    return { ...filtered, page: filterObject(event.page, [pageProps]) };
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
    const cart = filterObject(event.cart, [cartProps]);
    cart.lineItems = this.filterLineItems(getProp(event, 'cart.lineItems'));
    return {
      ...filtered,
      cart,
    };
  }

  filterCompletedTransaction(event) {
    const filtered = this.filterCommonEvent(event);
    const transaction = filterObject(event.cart, [transactionProps]);
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
    const listing = filterObject(event.listing, [listingProps]);
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
    if (event.campaign) {
      return {
        ...filtered,
        campaing: filterObject(event.campaign, [campaignProps]),
      };
    } else if (event.campaigns) {
      return {
        ...filtered,
        campaigns: fitlerObjectsArray(event.campaigns, [campaignProps]),
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
      user: event.user,
      timestamp: event.timestamp,
    });
  }
}

export default Filters;
