import getProperty from './functions/getProperty.js';
import clone from 'component-clone';

class DDHelper {

  static get(key, digitalData) {
    const value = getProperty(digitalData, key);
    return clone(value);
  }

  static getProduct(id, digitalData, listName = undefined) {
    if (!listName && digitalData.product && String(digitalData.product.id) === String(id)) {
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
          if (listing.items && listing.items.length && (!listName || listName === listing.listName)) {
            for (let i = 0, length = listing.items.length; i < length; i++) {
              if (listing.items[i].id && String(listing.items[i].id) === String(id)) {
                const product = clone(listing.items[i]);
                product.position = product.position || (i + 1);
                if (listing.listName) product.listName = product.listName || listing.listName;
                return product;
              }
            }
          }
        }
      }
    }
    // search in cart
    if (!listName && digitalData.cart && digitalData.cart.lineItems && digitalData.cart.lineItems.length) {
      for (const lineItem of digitalData.cart.lineItems) {
        if (lineItem.product && String(lineItem.product.id) === String(id)) {
          return clone(lineItem.product);
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
