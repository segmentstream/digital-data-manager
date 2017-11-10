import { error as errorLog } from 'driveback-utils/safeConsole';
import Handler from './../Handler';

class CustomScript {
  constructor(name, event, handler, fireOnce, digitalData) {
    this.name = name;
    this.event = event;
    this.handler = handler;
    this.fireOnce = fireOnce || false;
    this.digitalData = digitalData;
    this.hasFired = false;
  }

  newHandler(args) {
    return new Handler(this.handler, this.digitalData, args);
  }

  run(event) {
    if (this.fireOnce && this.hasFired) return;

    let handler;
    if (!event && !this.event) {
      handler = this.newHandler();
    } else if (event.name === this.event) {
      handler = this.newHandler([event]);
    }

    try {
      handler.run();
      this.hasFired = true;
    } catch (e) {
      errorLog(`Uncaught error in Custom Script "${this.name}":`, e);
    }
  }
}

export default CustomScript;
