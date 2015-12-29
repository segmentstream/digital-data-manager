import GoogleTagManager from './integrations/GoogleTagManager.js';
import Driveback from './integrations/Driveback.js';
import RetailRocket from './integrations/RetailRocket.js';

const integrations = {
  [GoogleTagManager.getName()]: GoogleTagManager,
  [Driveback.getName()]: Driveback,
  [RetailRocket.getName()]: RetailRocket,
};

export default integrations;
