import GoogleAnalytics from './integrations/GoogleAnalytics';
import GoogleTagManager from './integrations/GoogleTagManager';
import GoogleAdWords from './integrations/GoogleAdWords';
import Driveback from './integrations/Driveback';
import RetailRocket from './integrations/RetailRocket';
import FacebookPixel from './integrations/FacebookPixel';
import SegmentStream from './integrations/SegmentStream';
import SendPulse from './integrations/SendPulse';
import OWOXBIStreaming from './integrations/OWOXBIStreaming';
import Criteo from './integrations/Criteo';
import MyTarget from './integrations/MyTarget';
import YandexMetrica from './integrations/YandexMetrica';
import Vkontakte from './integrations/Vkontakte';
import Emarsys from './integrations/Emarsys';
import OneSignal from './integrations/OneSignal';
import Sociomantic from './integrations/Sociomantic';
import Admitad from './integrations/Admitad';
import Actionpay from './integrations/Actionpay';
import Mindbox from './integrations/Mindbox.js';
import DoubleClickFloodlight from './integrations/DoubleClickFloodlight';
import RTBHouse from './integrations/RTBHouse';
import Ofsys from './integrations/Ofsys';
import Soloway from './integrations/Soloway';
import OneDMC from './integrations/OneDMC';

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
  'OneSignal': OneSignal,
  'Sociomantic': Sociomantic,
  'Admitad': Admitad,
  'Actionpay': Actionpay,
  'Mindbox': Mindbox,
  'DoubleClick Floodlight': DoubleClickFloodlight,
  'RTB House': RTBHouse,
  'Ofsys': Ofsys,
  'Soloway': Soloway,
  '1DMC': OneDMC,
};

export default integrations;
