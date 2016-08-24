import './polyfill.js';
import ddManager from './ddManager.js';
import availableIntegrations from './availableIntegrations.js';

const earlyStubsQueue = window.ddManager;
window.ddManager = ddManager;

ddManager.setAvailableIntegrations(availableIntegrations);
ddManager.processEarlyStubCalls(earlyStubsQueue);
