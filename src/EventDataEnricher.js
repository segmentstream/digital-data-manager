import type from 'component-type';
import clone from 'component-clone';
import DDHelper from './DDHelper.js';
import dotProp from './functions/dotProp';

class EventDataEnricher
{
  static enrichCommonData(event, digitalData) {
    const enrichableVars = [
      'product',
      'listItem',
      'listItems',
      'campaign',
      'campaigns',
    ];

    for (const enrichableVar of enrichableVars) {
      if (event[enrichableVar]) {
        const enricherMethod = EventDataEnricher[enrichableVar];
        const eventVar = event[enrichableVar];
        event[enrichableVar] = enricherMethod(eventVar, digitalData);
      }
    }

    // enrich digitalData version
    if (!event.version && digitalData.version) {
      event.version = digitalData.version;
    }

    return event;
  }

  static enrichIntegrationData(event, digitalData, integration) {
    const enrichedEvent = clone(event);
    const enrichableProps = integration.getEnrichableEventProps(event);
    for (const prop of enrichableProps) {
      if (!dotProp.getProp(event, prop)) {
        const ddlPropValue = dotProp.getProp(digitalData, prop);
        if (ddlPropValue !== undefined) {
          dotProp.setProp(enrichedEvent, prop, ddlPropValue);
        }
      }
    }
    return enrichedEvent;
  }

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
}

export default EventDataEnricher;
