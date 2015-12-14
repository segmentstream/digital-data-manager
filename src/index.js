import './polyfill.js';
import ddManager from './ddManager.js';
import availableIntegrations from './availableIntegrations.js';

ddManager.setAvailableIntegrations(availableIntegrations);
ddManager.processEarlyStubCalls();

window.ddManager = ddManager;
