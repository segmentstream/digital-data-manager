import './polyfill'
import ddManager from './ddManager'
import availableIntegrations from './availableIntegrations'

const earlyStubsQueue = window.ddManager || window.segmentstream
const { SNIPPET_VERSION } = earlyStubsQueue || {}

ddManager.SNIPPET_VERSION = SNIPPET_VERSION

window.ddManager = ddManager
window.segmentstream = ddManager

ddManager.setAvailableIntegrations(availableIntegrations)
ddManager.processEarlyStubCalls(earlyStubsQueue)
