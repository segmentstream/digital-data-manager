import { getProp, setProp } from '@segmentstream/utils/dotProp';
import clone from '@segmentstream/utils/clone';
import deleteProperty from '@segmentstream/utils/deleteProperty';

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

  static replace(newDigitalData, digitalData) {
    Object.keys(digitalData).forEach((key) => {
      if ([
        'changes',
        'events',
        'version',
        'context',
        'user',
        'cart',
        'website',
      ].indexOf(key) < 0) {
        deleteProperty(digitalData, key);
      }
    });
    Object.keys(newDigitalData).forEach((key) => {
      if ([
        'changes',
        'events',
      ].indexOf(key) < 0) {
        DDHelper.set(key, newDigitalData[key], digitalData);
      }
    });
    digitalData.changes.length = 0;

    // clear events only if we fired all of them
    if (digitalData.events.filter(e => !e.hasFired).length === 0) {
      digitalData.events.length = 0;
    }
  }

  static getProduct(id, skuCode, digitalData) {
    if (digitalData.product && String(digitalData.product.id) === String(id)) {
      return clone(digitalData.product);
    }
    // search in listings
    let result;

    ['listing', 'recommendation', 'wishlist'].some((listingKey) => {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        listings.some((listing) => {
          if (listing.items && listing.items.length) {
            listing.items.some((listingItem) => {
              if (matchProduct(id, skuCode, listingItem)) {
                result = clone(listingItem);
                return true;
              }
              return false;
            });
            if (result) return true;
          }
          return false;
        });
      }
      if (result) return true;
      return false;
    });

    if (result) return result;

    // search in cart
    if (digitalData.cart && digitalData.cart.lineItems && digitalData.cart.lineItems.length) {
      digitalData.cart.lineItems.some((lineItem) => {
        if (matchProduct(id, skuCode, lineItem.product)) {
          result = clone(lineItem.product);
          return true;
        }
        return false;
      });
    }

    return result;
  }

  static getListItem(id, digitalData, listId) {
    let result;

    ['listing', 'recommendation', 'wishlist'].some((listingKey) => {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        listings.some((listing) => {
          if (listing.items && listing.items.length && (!listId || listId === listing.listId)) {
            for (let i = 0, { length } = listing.items; i < length; i += 1) {
              if (matchProductById(id, listing.items[i])) {
                const product = clone(listing.items[i]);
                result = {};
                result.product = product;
                result.position = (i + 1);
                result.listId = listId || listing.listId;
                result.listName = listing.listName;
                return true;
              }
            }
          }
          return false;
        });
        if (result) return true;
      }
      return false;
    });

    return result;
  }

  static getCampaign(id, digitalData) {
    let result;
    if (digitalData.campaigns && digitalData.campaigns.length) {
      digitalData.campaigns.some((campaign) => {
        if (campaign.id && String(campaign.id) === String(id)) {
          result = clone(campaign);
          return true;
        }
        return false;
      });
    }
    return result;
  }
}

export default DDHelper;
