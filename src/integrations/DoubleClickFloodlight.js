import Integration from './../Integration';
import arrayMerge from './../functions/arrayMerge';
import queryString from './../functions/queryString';
import { getProp } from './../functions/dotProp';
import { COMPLETED_TRANSACTION } from './events';

class DoubleClickFloodlight extends Integration {

  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      advertiserId : '',
      eventTags: {},
      /* example:
      eventTags: {
        'Viewed Product Detail': {
          groupTag: 'test',
          activityTag: 'test',
          customVars: {
            'u1': {
              type: 'digitalData',
              value: 'user.isSubscribed'
            }
          }
        }
      },
      */
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.tagEvents = Object.keys(this.getOption('eventTags'));
    this.enrichableEventProps = [];
    this.SEMANTIC_EVENTS = [];

    for (const tagEvent of this.tagEvents) {
      const tagOptions = this.getOption('eventTags')[tagEvent];
      if (tagOptions) {
        this.enrichableEventProps[tagEvent] = getEnrichableVariableMappingProps(tagOptions.customVars));
        this.SEMANTIC_EVENTS.push(tagEvent);
      }
    }

    this.addTag({
      type: 'img',
      attr: {
        src: `//ad.doubleclick.net/activity;src={{ src }};type={{ type }};cat={{ cat }};ord={{ ord }}{{ customVariables }}?`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    if (enrichableEventProps[tagEvent]) {
      return enrichableEventProps[tagEvent];
    }
    return [];
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const tagEvents = this.getOption('tagEvents');
    const tagOptions = tagEvents[event.name];
    if (tagOptions) {
      const customVariables = extractVariableMappingValues(event, tagEvents[event.name].customVars);
      const customVariablesStr = queryString.stringify(customVariables).replace(/&/g, ';');

      let commonTagParams = {
        src: this.getOption('advertiserId'),
        type: tagOptions.groupTag,
        cat: tagOptions.activityTag,
        ord: orderId,
        customVariables: customVariablesStr,
      };
      let tagParams;

      if (event.name === COMPLETED_TRANSACTION) {
        tagParams = this.getSaleTagParams(transaction);
      } else {
        tagParams = this.getCustomEventTagParams();
      }

      tagParams = Object.assign(commonTagParams, tagParams);

      this.load(tagParams);
    }
  }

  getSaleTagParams(transaction) {
    if (transaction) {
      const lineItems = transaction.lineItems;
      const hasLineItems = lineItems && Array.isArray(lineItems);
      return cleanObject({
        ord: transaction.orderId,
        cost: transaction.total,
        qty: (hasLineItems) ? lineItems.reduce(function(acc, lineItem) {
          return acc + lineItem.quantity || 1;
        }, 0);
      });
    } else {
      return this.getCustomEventTagParams();
    }
  }

  getCustomEventTagParams(tagParams) {
    return {
      ord: Math.random() * 10000000000000000000;
    }
  }
}

export default DoubleClickFloodlight;
