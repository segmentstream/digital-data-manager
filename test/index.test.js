window.localStorage.clear();
console.error = () => {};
console.warn = () => {};

// window.__DEV_MODE__ = true; // disable catching exceptions

import '../src/polyfill';

// tests
import './polyfill.spec';

import './RollingAttributesHelper.spec';
import './ddManager.spec';
import './DDHelper.spec';
import './DDStorage.spec';
import './EventManager.spec';
import './EventDataEnricher.spec';
import './DigitalDataEnricher.spec';
import './EventValidator.spec';

// enrichments & events
import './enrichments/CustomEnrichments.spec';
import './events/CustomEvents.spec';
import './scripts/CustomScripts.spec';

// trackers
import './trackers/trackLink.spec';

// integrations
import './integrations/GoogleAnalytics.spec';
import './integrations/GoogleTagManager.spec';
import './integrations/GoogleAdWords.spec';
import './integrations/Driveback.spec';
import './integrations/RetailRocket.spec';
import './integrations/FacebookPixel.spec';
import './integrations/SegmentStream.spec';
import './integrations/SendPulse.spec';
import './integrations/OWOXBIStreaming.spec';
import './integrations/Criteo.spec';
import './integrations/MyTarget.spec';
import './integrations/YandexMetrica.spec';
import './integrations/Vkontakte.spec';
import './integrations/Emarsys.spec';
import './integrations/OneSignal.spec';
import './integrations/Sociomantic.spec';
import './integrations/Mindbox.spec';
import './integrations/DoubleClickFloodlight.spec';
import './integrations/RTBHouse.spec';
import './integrations/Soloway.spec';
