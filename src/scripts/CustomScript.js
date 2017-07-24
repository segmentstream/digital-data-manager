import Handler from './../Handler';
import { error as errorLog } from './../functions/safeConsole';

class CustomScript {
  constructor(name, event, handler, digitalData, eventManager) {
    this.name = name;
    this.event = event;
    this.handler = handler;
    this.digitalData = digitalData;
    this.eventManager = eventManager;
  }

  newHandler(args) {
    return new Handler(this.handler, this.digitalData, args);
  }

  run(event) {
    let handler;
    if (!event && !this.event) {
      handler = this.newHandler();
    } else if (event.name === this.event) {
      handler = this.newHandler([event]);
    }
    try {
      handler.run();
    } catch (e) {
      errorLog(`Uncaught error in Custom Script "${this.name}":`, e);
    }
  }
}

export default CustomScript;
