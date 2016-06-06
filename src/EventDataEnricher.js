import type from 'component-type';
import DDHelper from './DDHelper.js';

class EventDataEnricher
{
  static product(productArr, digitalData) {
    productArr = productArr || [];
    let productId;
    let returnArray = true;
    if (!Array.isArray(productArr)) {
      returnArray = false;
      productArr = [productArr];
    }

    const result = [];
    for (let product of productArr) {
      if (type(product) === 'object') {
        productId = product.id;
      } else {
        productId = product;
        product = {
          id: productId,
        };
      }

      if (productId) {
        const ddlProduct = DDHelper.getProduct(productId, digitalData, product.listName) || {};
        if (ddlProduct) {
          product = Object.assign(ddlProduct, product);
        }
      }
      result.push(product);
    }

    if (!returnArray) {
      return result.pop();
    }
    return result;
  }

  static transaction(transaction, digitalData) {
    transaction = transaction || {};
    const ddlTransaction = DDHelper.get('transaction', digitalData) || {};
    if (ddlTransaction) {
      transaction = Object.assign(ddlTransaction, transaction);
    }

    return transaction;
  }

  static campaign(campaignArr, digitalData) {
    campaignArr = campaignArr || [];
    let campaignId;
    let returnArray = true;
    if (!Array.isArray(campaignArr)) {
      returnArray = false;
      campaignArr = [campaignArr];
    }

    const result = [];
    for (let campaign of campaignArr) {
      if (type(campaign) === 'object') {
        campaignId = campaign.id;
      } else {
        campaignId = campaign;
        campaign = {
          id: campaignId,
        };
      }

      if (campaignId) {
        const ddlCampaign = DDHelper.getCampaign(campaignId, digitalData) || {};
        if (ddlCampaign) {
          campaign = Object.assign(ddlCampaign, campaign);
        }
      }
      result.push(campaign);
    }

    if (!returnArray) {
      return result.pop();
    }
    return result;
  }

  static user(user, digitalData) {
    user = user || {};
    const ddlUser = DDHelper.get('user', digitalData) || {};
    if (ddlUser) {
      user = Object.assign(ddlUser, user);
    }

    return user;
  }

  static page(page, digitalData) {
    page = page || {};
    const ddlPage = DDHelper.get('page', digitalData) || {};
    if (ddlPage) {
      page = Object.assign(ddlPage, page);
    }

    return page;
  }
}

export default EventDataEnricher;
