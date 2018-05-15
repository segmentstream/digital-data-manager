import trackImpression from './../trackers/trackImpression';
import trackLink from './../trackers/trackLink';
import Handler from './../Handler';
import { error as errorLog } from 'driveback-utils/safeConsole';
import isPromise from 'driveback-utils/isPromise';
import { CUSTOM_EVENT_SOURCE } from '../constants';

const TRIGGER_EVENT = 'event';
const TRIGGER_IMPRESSION = 'impression';
const TRIGGER_CLICK = 'click';

class CustomEvent {
  constructor(name, trigger, settings, handler, digitalData, eventManager) {
    this.name = name;
    this.trigger = trigger;
    this.settings = settings || {};
    this.handler = handler;
    this.digitalData = digitalData;
    this.eventManager = eventManager;
  }

  track() {
    if (this.trigger === TRIGGER_EVENT) {
      this.trackEvent();
    } else if (this.trigger === TRIGGER_CLICK) {
      this.trackClick();
    } else if (this.trigger === TRIGGER_IMPRESSION) {
      this.trackImpression();
    }
  }

  newHandler(args) {
    return new Handler(this.handler, this.digitalData, args);
  }

  resolveHandlerAndFireEvent(args) {
    const handler = this.newHandler(args);
    try {
      const result = handler.run();
      if (result) {
        if (isPromise(result)) {
          result.then((event) => {
            this.fireEvent(event);
          });
        } else {
          this.fireEvent(result);
        }
      }
    } catch (e) {
      errorLog(`Custom Event "${this.name}" handler error:`);
      errorLog(e);
    }
  }

  trackEvent() {
    if (!this.settings.event) return;
    this.eventManager.addCallback(['on', 'event', (event) => {
      if (event.name === this.settings.event && !event.stopPropagation) {
        this.resolveHandlerAndFireEvent([event]);
      }
    }]);
  }

  trackImpression() {
    if (!this.settings.selector) return;
    trackImpression(this.settings.selector, (elements) => {
      this.resolveHandlerAndFireEvent([elements]);
    });
  }

  trackClick() {
    if (!this.settings.selector) return;
    trackLink(this.settings.selector, (element) => {
      this.resolveHandlerAndFireEvent([element]);
    }, this.settings.followLink);
  }

  fireEvent(event) {
    if (!event) return;
    if (typeof event !== 'object') {
      errorLog(`Custom Event "${this.name}" was disabled: returned event should be object`);
      return;
    }
    if (!event.name) {
      errorLog(`Custom Event "${this.name}" was disabled: returned event name is undefined`);
      return;
    }
    if (this.trigger === TRIGGER_EVENT) {
      if (event.name === this.settings.event && !event.stopPropagation) {
        errorLog(`Custom Event "${this.name}" was disabled: recursion error`);
        return;
      }
    }

    if (!event.source) {
      event.source = CUSTOM_EVENT_SOURCE;
    }
    this.digitalData.events.push(event);
  }
}

export default CustomEvent;
