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
import Mindbox from './integrations/Mindbox';
import DoubleClickFloodlight from './integrations/DoubleClickFloodlight';
import RTBHouse from './integrations/RTBHouse';
import Ofsys from './integrations/Ofsys';
import Soloway from './integrations/Soloway';
import OneDMC from './integrations/OneDMC';
import AdSpire from './integrations/AdSpire';
import Weborama from './integrations/Weborama';
import CityAds from './integrations/CityAds';
import Aidata from './integrations/Aidata';
import Segmento from './integrations/Segmento';
import Mixmarket from './integrations/Mixmarket';
import GdeSlon from './integrations/GdeSlon';
import RichRelevance from './integrations/RichRelevance';
import Linkprofit from './integrations/Linkprofit';
import Flocktory from './integrations/Flocktory';

const integrations = {
  'Google Analytics': GoogleAnalytics,
  'Google Tag Manager': GoogleTagManager,
  'Google AdWords': GoogleAdWords,
  'OWOX BI Streaming': OWOXBIStreaming,
  'Facebook Pixel': FacebookPixel,
  Driveback,
  'Retail Rocket': RetailRocket,
  SegmentStream,
  SendPulse,
  Criteo,
  myTarget: MyTarget,
  'Yandex Metrica': YandexMetrica,
  Vkontakte,
  Emarsys,
  OneSignal,
  Sociomantic,
  Admitad,
  Actionpay,
  Mindbox,
  'DoubleClick Floodlight': DoubleClickFloodlight,
  'RTB House': RTBHouse,
  Ofsys,
  Soloway,
  '1DMC': OneDMC,
  AdSpire,
  Weborama,
  CityAds,
  Aidata,
  Segmento,
  Mixmarket,
  GdeSlon,
  RichRelevance,
  Linkprofit,
  Flocktory,
};

export default integrations;
