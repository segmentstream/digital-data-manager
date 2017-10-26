import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from './../IntegrationUtils';
import Integration from './../Integration';
import { stringify } from 'driveback-utils/queryString';
import cleanObject from 'driveback-utils/cleanObject';
import { COMPLETED_TRANSACTION } from './../events/semanticEvents';

/** 
* Example: 
  events: [
    {
      event: 'Viewed Product Detail',
      groupTag: 'test',
      activityTag: 'test',
      customVars: {
        u1: {
          type: 'digitalData',
          value: 'user.isSubscribed',
        },
      },
    },
  ],
*/
class DoubleClickFloodlight extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      advertiserId: '',
      events: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.enrichableEventProps = [];
    this.SEMANTIC_EVENTS = [];

    this.getOption('events').forEach((eventOptions) => {
      const eventName = eventOptions.event;
      if (!eventName) return;

      this.enrichableEventProps[eventName] =
        getEnrichableVariableMappingProps(eventOptions.customVars);
      this.SEMANTIC_EVENTS.push(eventName);
    });

    this.addTag('counter', {
      type: 'iframe',
      attr: {
        src: 'https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?',
      },
    });

    this.addTag('sales', {
      type: 'iframe',
      attr: {
        src: 'https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};qty={{ qty }};cost={{ cost }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?',
      },
    });
  }

  initialize() {
    this._isLoaded = true;
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    if (this.enrichableEventProps[event.name]) {
      return this.enrichableEventProps[event.name];
    }
    return [];
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const events = this.getOption('events').filter((eventOptions) => {
      return eventOptions.event === event.name;
    });

    events.forEach((eventOptions) => {
      const customVariables = extractVariableMappingValues(event, eventOptions.customVars);
      const customVariablesStr = stringify(customVariables).replace(/&/g, ';');

      const commonTagParams = {
        src: this.getOption('advertiserId'),
        type: eventOptions.groupTag,
        cat: eventOptions.activityTag,
        customVariables: customVariablesStr,
      };

      let tagParams;
      let tagName;
      if (event.name === COMPLETED_TRANSACTION) {
        tagParams = this.getSaleTagParams(event.transaction);
        tagName = 'sales';
      } else {
        tagParams = this.getCounterTagParams();
        tagName = 'counter';
      }
      tagParams = Object.assign(commonTagParams, tagParams);
      this.load(tagName, tagParams);
    });
  }

  getSaleTagParams(transaction) {
    if (transaction) {
      const lineItems = transaction.lineItems;
      const hasLineItems = lineItems && Array.isArray(lineItems);
      return cleanObject({
        ord: transaction.orderId,
        cost: transaction.total || transaction.subtotal,
        qty: (hasLineItems) ?
          lineItems.reduce((acc, lineItem) => acc + lineItem.quantity || 1, 0) : undefined,
      });
    }
    return this.getCustomEventTagParams();
  }

  getCounterTagParams() {
    return {
      ord: Math.random() * 10000000000000000000,
    };
  }
}

export default DoubleClickFloodlight;
