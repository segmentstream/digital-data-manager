import DDHelper from './../DDHelper';
import dotProp from 'driveback-utils/dotProp';
import deleteProperty from 'driveback-utils/deleteProperty';
import {
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';
import IntegrationEventEnrichment from './IntegrationEventEnrichment';

class EventDataEnricher {
  static enrichCommonData(event, digitalData) {
    const enrichableVars = [
      'product',
      'listItem',
      'listItems',
      'campaign',
      'campaigns',
    ];

    enrichableVars.forEach((enrichableVar) => {
      if (event[enrichableVar]) {
        const enricherMethod = EventDataEnricher[enrichableVar];
        const eventVar = event[enrichableVar];
        event[enrichableVar] = enricherMethod(eventVar, digitalData);
      }
    });

    if (event.name === VIEWED_PRODUCT_DETAIL && !event.product && digitalData.product) {
      event.product = DDHelper.get('product', digitalData);
    } else if (
      event.name === COMPLETED_TRANSACTION
      && !event.transaction && digitalData.transaction
    ) {
      event.transaction = DDHelper.get('transaction', digitalData);
    }

    // enrich digitalData version
    if (!event.version && digitalData.version) {
      event.version = digitalData.version;
    }

    return event;
  }

  static enrichIntegrationData(event, digitalData, integration) {
    const enrichableProps = integration.getEnrichableEventProps(event);
    enrichableProps.forEach((prop) => {
      if (!dotProp.getProp(event, prop) && digitalData) {
        let propToEnrich = prop;

        // if prop is special case: *.length, *.first, *.last, etc
        // drawback - instead of enriching just length - whole object is enirched
        if (prop.endsWith('.length')) {
          propToEnrich = prop.replace(/\.length$/, '');
        }

        const ddlPropValue = DDHelper.get(propToEnrich, digitalData); // cloned value returned
        if (ddlPropValue !== undefined) {
          dotProp.setProp(event, propToEnrich, ddlPropValue);
        }
      }
    });

    // handle event override
    if (integration.getEventOverrideFunction()) {
      integration.getEventOverrideFunction()(event);
    }
    // handle product override
    if (integration.getProductOverrideFunction()) {
      event = EventDataEnricher.overrideEventProducts(event, integration);
    }
    // handle custom event enrichments
    integration.getEventEnrichments()
      .filter(eventEnrichment => !eventEnrichment.event || eventEnrichment.event === event.name)
      .forEach((eventEnrichment) => {
        const enrichment = new IntegrationEventEnrichment(
          eventEnrichment.prop,
          eventEnrichment.handler,
          digitalData,
        );
        enrichment.enrich(event);
      });

    return event;
  }

  static overrideEventProducts(event, integration) {
    if (event.product) {
      integration.getProductOverrideFunction()(event.product);
    } else if (event.listing && event.listing.items) {
      event.listing.items.forEach((product) => {
        integration.getProductOverrideFunction()(product);
      });
    } else if (event.cart && event.cart.lineItems) {
      event.cart.lineItems.forEach((lineItem) => {
        integration.getProductOverrideFunction()(lineItem.product);
      });
    } else if (event.transaction && event.transaction.lineItems) {
      event.transaction.lineItems.forEach((lineItem) => {
        integration.getProductOverrideFunction()(lineItem.product);
      });
    } else if (event.listItem || event.listItems) {
      if (event.listItem) {
        integration.getProductOverrideFunction()(event.listItem.product);
      } else if (event.listItems) {
        event.listItems.forEach((listItem) => {
          integration.getProductOverrideFunction()(listItem.product);
        });
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
      const ddlProduct = DDHelper.getProduct(productId, product.skuCode, digitalData) || {};
      if (ddlProduct) {
        product = Object.assign(ddlProduct, product);
      }
    }

    return product;
  }

  static listItem(listItem, digitalData) {
    let productId;

    if (!listItem.listId) {
      deleteProperty(listItem, 'listId');
    }

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
    listItems.forEach((listItem) => {
      const enrichedListItem = EventDataEnricher.listItem(listItem, digitalData);
      result.push(enrichedListItem);
    });
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
    campaigns.forEach((campaign) => {
      result.push(EventDataEnricher.campaign(campaign, digitalData));
    });
    return result;
  }
}

export default EventDataEnricher;
