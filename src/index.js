import 'core-js/es5';
import 'core-js/es6/object';
import 'core-js/es6/array';
import DDManager from './DDManager.js';
import availableIntegrations from './availableIntegrations.js';

DDManager.setAvailableIntegrations(availableIntegrations);

const ddManager = new DDManager();
ddManager.processEarlyStubCalls();

window.ddManager = ddManager;
