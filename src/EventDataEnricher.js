import type from 'component-type';
import DDHelper from './DDHelper.js';

class EventDataEnricher
{
  static product(product, digitalData) {
    let productId;

    if (type(product) === 'object') {
      productId = product.id;
    } else {
      productId = product;
      product = {
        id: productId,
      };
    }

    if (productId) {
      const ddlProduct = DDHelper.getProduct(productId, digitalData) || {};
      if (ddlProduct) {
        product = Object.assign(ddlProduct, product);
      }
    }

    return product;
  }

  static listItem(listItem, digitalData) {
    let productId;

    if (type(listItem.product) === 'object') {
      productId = listItem.product.id;
    } else {
      productId = listItem.product;
      listItem.product = {
        id: productId,
      };
    }

    if (productId) {
      const ddlListItem = DDHelper.getListItem(productId, digitalData, listItem.listId);
      if (ddlListItem) {
        listItem.product = Object.assign(ddlListItem.product, listItem.product);
        listItem = Object.assign(ddlListItem, listItem);
      }
    }

    return listItem;
  }

  static listItems(listItems, digitalData) {
    const result = [];
    for (const listItem of listItems) {
      const enrichedListItem = EventDataEnricher.listItem(listItem, digitalData);
      result.push(enrichedListItem);
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

  static campaign(campaign, digitalData) {
    let campaignId;
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

    return campaign;
  }

  static campaigns(campaigns, digitalData) {
    const result = [];
    for (const campaign of campaigns) {
      result.push(EventDataEnricher.campaign(campaign, digitalData));
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
