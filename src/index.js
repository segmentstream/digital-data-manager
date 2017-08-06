import './polyfill';
import ddManager from './ddManager';
import availableIntegrations from './availableIntegrations';

const earlyStubsQueue = window.ddManager;
window.ddManager = ddManager;

ddManager.setAvailableIntegrations(availableIntegrations);
ddManager.processEarlyStubCalls(earlyStubsQueue);
