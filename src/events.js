export const VIEWED_PAGE = 'Viewed Page';
export const VIEWED_PRODUCT_DETAIL = 'Viewed Product Detail';
export const VIEWED_PRODUCT_LISTING = 'Viewed Product Listing';
export const SEARCHED_PRODUCTS = 'Searched Products';
export const VIEWED_CART = 'Viewed Cart';
export const COMPLETED_TRANSACTION = 'Completed Transaction';
export const VIEWED_CHECKOUT_STEP = 'Viewed Checkout Step';
export const COMPLETED_CHECKOUT_STEP = 'Completed Checkout Step';
export const REFUNDED_TRANSACTION = 'Refunded Transaction';
export const VIEWED_PRODUCT = 'Viewed Product';
export const CLICKED_PRODUCT = 'Clicked Product';
export const ADDED_PRODUCT = 'Added Product';
export const REMOVED_PRODUCT = 'Removed Product';
export const VIEWED_CAMPAIGN = 'Viewed Campaign';
export const CLICKED_CAMPAIGN = 'Clicked Campaign';
export const SUBSCRIBED = 'Subscribed';
export const REGISTERED = 'Registered';
export const LOGGED_IN = 'Logged In';
export const VIEWED_EXPERIMENT = 'Viewed Experiment';
export const ACHIEVED_EXPERIMENT_GOAL = 'Achieved Experiment Goal';

// legacy events
export const VIEWED_PRODUCT_CATEGORY = 'Viewed Product Category';
export const SEARCHED = 'Searched';

// legacy events mapping
const eventMapper = {
  [SEARCHED]: SEARCHED_PRODUCTS,
  [VIEWED_PRODUCT_CATEGORY]: VIEWED_PRODUCT_LISTING,
};

export function mapEvent(eventName) {
  return (eventMapper[eventName]) ? eventMapper[eventName] : eventName;
}
