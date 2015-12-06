import 'core-js/es5';
import 'core-js/es6/object';
import 'core-js/es6/array';
import ddManager from './ddManager.js';
import availableIntegrations from './availableIntegrations.js';

ddManager.setAvailableIntegrations(availableIntegrations);
ddManager.processEarlyStubCalls();

window.ddManager = ddManager;
