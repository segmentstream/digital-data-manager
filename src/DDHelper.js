import clone from 'component-clone';

function _keyToArray(key) {
  key = key.trim();
  if (key === '') {
    return [];
  }
  key = key.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  return key.split('.');
}

class DDHelper {

  static get(key, digitalData) {
    const keyParts = _keyToArray(key);
    let nestedVar = clone(digitalData);
    while (keyParts.length > 0) {
      const childKey = keyParts.shift();
      if (nestedVar.hasOwnProperty(childKey)) {
        nestedVar = nestedVar[childKey];
      } else {
        return undefined;
      }
    }
    return nestedVar;
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
            for (const product of listing.items) {
              if (product.id && String(product.id) === String(id)) {
                return clone(product);
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
