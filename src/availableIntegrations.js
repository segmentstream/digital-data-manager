import GoogleAnalytics from './integrations/GoogleAnalytics.js';
import GoogleTagManager from './integrations/GoogleTagManager.js';
import GoogleAdWords from './integrations/GoogleAdWords.js';
import Driveback from './integrations/Driveback.js';
import RetailRocket from './integrations/RetailRocket.js';
import FacebookPixel from './integrations/FacebookPixel.js';
import SegmentStream from './integrations/SegmentStream.js';
import SendPulse from './integrations/SendPulse.js';
import OWOXBIStreaming from './integrations/OWOXBIStreaming.js';
import Criteo from './integrations/Criteo.js';
import MyTarget from './integrations/MyTarget.js';
import YandexMetrica from './integrations/YandexMetrica.js';
import Vkontakte from './integrations/Vkontakte.js';
import Emarsys from './integrations/Emarsys.js';
import Sociomantic from './integrations/Sociomantic.js';
import Mindbox from './integrations/Mindbox.js';

const integrations = {
  'Google Analytics': GoogleAnalytics,
  'Google Tag Manager': GoogleTagManager,
  'Google AdWords': GoogleAdWords,
  'OWOX BI Streaming': OWOXBIStreaming,
  'Facebook Pixel': FacebookPixel,
  'Driveback': Driveback,
  'Retail Rocket': RetailRocket,
  'SegmentStream': SegmentStream,
  'SendPulse': SendPulse,
  'Criteo': Criteo,
  'myTarget': MyTarget,
  'Yandex Metrica': YandexMetrica,
  'Vkontakte': Vkontakte,
  'Emarsys': Emarsys,
  'Sociomantic': Sociomantic,
  'Mindbox': Mindbox,
};

export default integrations;
