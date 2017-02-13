import clone from './functions/clone';
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
    let enrichedEvent = clone(event, true);
    const enrichableProps = integration.getEnrichableEventProps(event);
    for (const prop of enrichableProps) {
      if (!dotProp.getProp(event, prop) && digitalData) {
        const ddlPropValue = dotProp.getProp(digitalData, prop);
        if (ddlPropValue !== undefined) {
          dotProp.setProp(enrichedEvent, prop, ddlPropValue);
        }
      }
    }

    // handle event override
    if (integration.getEventOverrideFunction()) {
      integration.getEventOverrideFunction()(enrichedEvent);
    }
    // handle product override
    if (integration.getProductOverrideFunction()) {
      enrichedEvent = EventDataEnricher.overrideEventProducts(enrichedEvent, integration);
    }

    return enrichedEvent;
  }

  static overrideEventProducts(event, integration) {
    if (event.product) {
      integration.getProductOverrideFunction()(event.product);
    } else if (event.listing && event.listing.items) {
      for (const product of event.listing.items) {
        integration.getProductOverrideFunction()(product);
      }
    } else if (event.cart && event.cart.lineItems) {
      for (const lineItem of event.cart.lineItems) {
        integration.getProductOverrideFunction()(lineItem.product);
      }
    } else if (event.transaction && event.transaction.lineItems) {
      for (const lineItem of event.transaction.lineItems) {
        integration.getProductOverrideFunction()(lineItem.product);
      }
    } else if (event.listItem || event.listItems) {
      if (event.listItem) {
        integration.getProductOverrideFunction()(event.listItem.product);
      } else if (event.listItems) {
        for (const listItem of event.listItems) {
          integration.getProductOverrideFunction()(listItem.product);
        }
      }
    }
    return event;
  }

  static product(product, digitalData) {
    let productId;

    if (typeof product === 'object') {
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

    if (typeof listItem.product === 'object') {
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
    if (typeof campaign === 'object') {
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
