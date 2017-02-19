import { getProp } from './functions/dotProp';
import clone from './functions/clone';

class DDHelper {

  static get(key, digitalData) {
    const value = getProp(digitalData, key);
    return clone(value);
  }

  static getProduct(id, digitalData) {
    if (digitalData.product && String(digitalData.product.id) === String(id)) {
      return clone(digitalData.product);
    }
    // search in listings
    for (const listingKey of ['listing', 'recommendation']) {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (const listing of listings) {
          if (listing.items && listing.items.length) {
            for (let i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
                const product = clone(listing.items[i]);
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
        if (lineItem.product && String(lineItem.product.id) === String(id)) {
          return clone(lineItem.product);
        }
      }
    }
  }

  static getListItem(id, digitalData, listId) {
    // search in listings
    const listingItem = {};
    for (const listingKey of ['listing', 'recommendation']) {
      let listings = digitalData[listingKey];
      if (listings) {
        if (!Array.isArray(listings)) {
          listings = [listings];
        }
        for (const listing of listings) {
          if (listing.items && listing.items.length && (!listId || listId === listing.listId)) {
            for (let i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
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
