import trackImpression from './../trackers/trackImpression';
import trackLink from './../trackers/trackLink';
import EventHandler from './EventHandler';

const TRIGGER_EVENT = 'event';
const TRIGGER_IMPRESSION = 'impression';
const TRIGGER_CLICK = 'click';

class CustomEvent {
  constructor(trigger, settings, handler, digitalData, eventManager) {
    this.trigger = trigger;
    this.settings = settings;
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

  newHandler(...args) {
    return new EventHandler(this.handler, this.digitalData, args);
  }

  trackEvent() {
    if (!this.settings.event) return;
    this.eventManager.addCallback(['on', 'event', (event) => {
      if (event.name === this.settings.event) {
        const handler = this.newHandler(event);
        handler.run();
      }
    }]);
  }

  trackImpression() {
    if (!this.settings.cssSelector) return;
    trackImpression(this.settings.cssSeelctor, (elements) => {
      const handler = this.newHandler(elements);
      handler.run();
    });
  }

  trackClick() {
    if (!this.settings.cssSelector) return;
    trackLink(this.settings.cssSelector, (element) => {
      const handler = this.newHandler(element);
      handler.run();
    });
  }
}

export default CustomEvent;
