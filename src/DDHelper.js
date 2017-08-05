import { getProp, setProp } from 'driveback-utils/dotProp';
import clone from 'driveback-utils/clone';

function matchProductById(id, product) {
  return product.id && String(product.id) === String(id);
}

function matchProductBySkuCode(skuCode, product) {
  return product.skuCode && String(product.skuCode) === String(skuCode);
}

function matchProduct(id, skuCode, product) {
  return (!skuCode || matchProductBySkuCode(skuCode, product)) && matchProductById(id, product);
}

class DDHelper {

  static get(key, digitalData) {
    const value = getProp(digitalData, key);
    return clone(value);
  }

  static set(key, value, digitalData) {
    setProp(digitalData, key, clone(value));
  }

  static getProduct(id, skuCode, digitalData) {
    if (digitalData.product && String(digitalData.product.id) === String(id)) {
      return clone(digitalData.product);
    }
    // search in listings
    for (const listingKey of ['listing', 'recommendation', 'wishlist']) {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (const listing of listings) {
          if (listing.items && listing.items.length) {
            for (const listingItem of listing.items) {
              if (matchProduct(id, skuCode, listingItem)) {
                const product = clone(listingItem);
                return product;
              }
            }
          }
        }
      }
    }
    // search in cart
    if (digitalData.cart && digitalData.cart.lineItems && digitalData.cart.lineItems.length) {
      for (const lineItem of digitalData.cart.lineItems) {
        if (matchProduct(id, skuCode, lineItem.product)) {
          return clone(lineItem.product);
        }
      }
    }
  }

  static getListItem(id, digitalData, listId) {
    // search in listings
    const listingItem = {};
    for (const listingKey of ['listing', 'recommendation', 'wishlist']) {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (const listing of listings) {
          if (listing.items && listing.items.length && (!listId || listId === listing.listId)) {
            for (let i = 0, length = listing.items.length; i < length; i++) {
              if (matchProductById(id, listing.items[i])) {
                const product = clone(listing.items[i]);
                listingItem.product = product;
                listingItem.position = (i + 1);
                listingItem.listId = listId || listing.listId;
                listingItem.listName = listing.listName;
                return listingItem;
              }
            }
          }
        }
      }
    }
  }

  static getCampaign(id, digitalData) {
    if (digitalData.campaigns && digitalData.campaigns.length) {
      for (const campaign of digitalData.campaigns) {
        if (campaign.id && String(campaign.id) === String(id)) {
          return clone(campaign);
        }
      }
    }
  }

}

export default DDHelper;
