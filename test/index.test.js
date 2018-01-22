window.localStorage.clear();
console.error = () => {};
console.warn = () => {};

// window.__DEV_MODE__ = true; // disable catching exceptions

import './../src/polyfill';

// tests
import './ddManagerSpec';
import './DDHelperSpec';
import './DDStorageSpec';
import './EventManagerSpec';
import './EventDataEnricherSpec';
import './DigitalDataEnricherSpec';
import './EventValidatorSpec';

// enrichments & events
import './enrichments/CustomEnricherSpec'; // @TODO: remove as legacy
import './enrichments/CustomEnrichmentsSpec';
import './events/CustomEventsSpec';
import './scripts/CustomScriptsSpec';

// trackers
import './trackers/trackLinkSpec';

// integrations
import './integrations/GoogleAnalyticsSpec';
import './integrations/GoogleTagManagerSpec';
import './integrations/GoogleAdWordsSpec';
import './integrations/DrivebackSpec';
import './integrations/RetailRocketSpec';
import './integrations/FacebookPixelSpec';
import './integrations/SegmentStreamSpec';
import './integrations/SendPulseSpec';
import './integrations/OWOXBIStreamingSpec';
import './integrations/CriteoSpec';
import './integrations/MyTargetSpec';
import './integrations/YandexMetricaSpec';
import './integrations/VkontakteSpec';
import './integrations/EmarsysSpec';
import './integrations/OneSignalSpec';
import './integrations/SociomanticSpec';
import './integrations/MindboxSpec';
import './integrations/DoubleClickFloodlightSpec';
import './integrations/RTBHouseSpec';
import './integrations/SolowaySpec';
