import GoogleTagManager from './integrations/GoogleTagManager.js';
import Driveback from './integrations/Driveback.js';
import RetailRocket from './integrations/RetailRocket.js';
import FacebookPixel from './integrations/FacebookPixel.js';

const integrations = {
  [GoogleTagManager.getName()]: GoogleTagManager,
  [FacebookPixel.getName()]: FacebookPixel,
  [Driveback.getName()]: Driveback,
  [RetailRocket.getName()]: RetailRocket,
};

export default integrations;
