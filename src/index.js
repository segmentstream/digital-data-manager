import './polyfill';
import ddManager from './ddManager';
import availableIntegrations from './availableIntegrations';

const earlyStubsQueue = window.ddManager || window.segmentstream;
window.ddManager = ddManager;
window.segmentstream = ddManager;

ddManager.setAvailableIntegrations(availableIntegrations);
ddManager.processEarlyStubCalls(earlyStubsQueue);
