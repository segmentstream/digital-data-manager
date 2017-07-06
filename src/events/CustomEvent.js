import trackImpression from './../trackers/trackImpression';
import trackLink from './../trackers/trackLink';
import Handler from './../Handler';
import { error as errorLog } from './../functions/safeConsole';

const TRIGGER_EVENT = 'event';
const TRIGGER_IMPRESSION = 'impression';
const TRIGGER_CLICK = 'click';

class CustomEvent {
  constructor(name, trigger, setting, handler, digitalData, eventManager) {
    this.name = name;
    this.trigger = trigger;
    this.setting = setting;
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

  trackEvent() {
    if (!this.setting) return;
    this.eventManager.addCallback(['on', 'event', (event) => {
      if (event.name === this.setting) {
        const handler = this.newHandler([event]);
        const resultEvent = handler.run();
        if (resultEvent && resultEvent.name && resultEvent.name === event.name) {
          errorLog(`Custom Event "${this.name}" was disabled: recursion error`);
        } else {
          this.fireEvent(resultEvent);
        }
      }
    }]);
  }

  trackImpression() {
    if (!this.setting) return;
    trackImpression(this.setting, (elements) => {
      const handler = this.newHandler([elements]);
      const resultEvent = handler.run();
      this.fireEvent(resultEvent);
    });
  }

  trackClick() {
    if (!this.setting) return;
    trackLink(this.setting, (element) => {
      const handler = this.newHandler([element]);
      const resultEvent = handler.run();
      this.fireEvent(resultEvent);
    });
  }

  fireEvent(event) {
    if (!event) return;
    if (typeof event !== 'object') {
      errorLog(`Custom Event "${this.name}" was disabled: returned event should be object`);
    }
    if (!event.name) {
      errorLog(`Custom Event "${this.name}" was disabled: returned event name is undefined`);
    }
    if (!event.source) {
      event.source = 'DDManager Custom Event';
    }
    this.digitalData.events.push(event);
  }
}

export default CustomEvent;
