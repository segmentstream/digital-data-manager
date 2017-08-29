window.localStorage.clear();
console.error = () => {};

// window.__DEV_MODE__ = true; // disable catching exceptions

import './../src/polyfill.js';

// tests
import './ddManagerSpec.js';
import './DDHelperSpec.js';
import './DDStorageSpec.js';
import './EventManagerSpec.js';
import './EventDataEnricherSpec.js';
import './DigitalDataEnricherSpec.js';
import './EventValidatorSpec.js';

// enrichments & events
import './enrichments/CustomEnricherSpec';
import './events/CustomEventsSpec';
import './scripts/CustomScriptsSpec';

// trackers
import './trackers/trackLinkSpec.js';

// integrations
// import './integrations/GoogleAnalyticsSpec.js';
// import './integrations/GoogleTagManagerSpec.js';
// import './integrations/GoogleAdWordsSpec.js';
// import './integrations/DrivebackSpec.js';
// import './integrations/RetailRocketSpec.js';
// import './integrations/FacebookPixelSpec.js';
// import './integrations/SegmentStreamSpec.js';
// import './integrations/SendPulseSpec.js';
// import './integrations/OWOXBIStreamingSpec.js'
// import './integrations/CriteoSpec.js';
// import './integrations/MyTargetSpec.js';
// import './integrations/YandexMetricaSpec.js';
// import './integrations/VkontakteSpec.js';
// import './integrations/EmarsysSpec.js';
// import './integrations/OneSignalSpec.js';
// import './integrations/SociomanticSpec.js';
// import './integrations/MindboxSpec.js';
// import './integrations/DoubleClickFloodlightSpec.js';
// import './integrations/RTBHouseSpec.js';
// import './integrations/SolowaySpec.js';
