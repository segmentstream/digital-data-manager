import deleteProperty from '@segmentstream/utils/deleteProperty'
import sha256 from 'crypto-js/sha256'
import { getProp } from '@segmentstream/utils/dotProp'
import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  ADDED_PRODUCT,
  COMPLETED_TRANSACTION,
  LOGGED_IN,
  REGISTERED,
  SUBSCRIBED
} from '../events/semanticEvents'
import AsyncQueue from './utils/AsyncQueue'

export const HOME_PAGE_TYPE = 'HOMEPAGE'
export const OTHER_PAGE_TYPE = 'OTHER'
export const PRODUCT_PAGE_TYPE = 'PRODUCT'
export const LISTING_PAGE_TYPE = 'CATEGORY'
export const CART_PAGE_TYPE = 'CART'

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  ADDED_PRODUCT,
  COMPLETED_TRANSACTION,
  LOGGED_IN,
  REGISTERED,
  SUBSCRIBED
]

class DynamicYield extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      accountId: '',
      feedWithGroupedProducts: false
    }, options)

    super(digitalData, optionsWithDefaults)

    // dynamicScript
    this.addTag({
      type: 'script',
      attr: {
        async: true,
        src: `//cdn.dynamicyield.com/api/${options.accountId}/api_dynamic.js`
      }
    })

    this.addTag('staticScript', {
      type: 'script',
      attr: {
        async: true,
        src: `//cdn.dynamicyield.com/api/${options.accountId}/api_static.js`
      }
    })
  }

  initialize () {
    window.DY = window.DY || {}
    this.asyncQueue = new AsyncQueue(() => this.isLoaded())
  }

  onLoadInitiated () {
    this.asyncQueue.init()
  }

  isLoaded () {
    return !!getProp(window, 'DY.API')
  }

  reset () {
    deleteProperty(window, 'DY')
  }

  trackPage (context) {
    if (!window.DY.recommendationContext) {
      window.DY.recommendationContext = context
      this.load('staticScript')
      this.pageTracked = true
    }
  }

  getSemanticEvents () {
    return SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    switch (event.name) {
      case VIEWED_PAGE:
        return [
          'page.type'
        ]
      case VIEWED_PRODUCT_DETAIL:
        return [
          'page.type',
          'product'
        ]
      case VIEWED_PRODUCT_LISTING:
        return [
          'page.type',
          'listing.category'
        ]
      case VIEWED_CART:
        return [
          'page.type',
          'cart.lineItems'
        ]
      case ADDED_PRODUCT:
        return [
          'product',
          'cart'
        ]
      case COMPLETED_TRANSACTION:
        return [
          'transaction'
        ]
      case LOGGED_IN:
        return [
          'user.userId',
          'user.email'
        ]
      case REGISTERED:
        return [
          'user.userId',
          'user.email'
        ]
      case SUBSCRIBED:
        return [
          'user.email'
        ]
      default:
        return []
    }
  }

  getProductId (product = {}) {
    return this.getOption('feedWithGroupedProducts') ? product.skuCode : product.id
  }

  getLineItemIds (lineItems) {
    return lineItems.map(lineItem => this.getProductId(lineItem.product))
  }

  getLineItems (lineItems) {
    return lineItems.map((lineItem) => {
      return cleanObject({
        productId: this.getProductId(lineItem.product),
        quantity: lineItem.quantity,
        itemPrice: getProp(lineItem, 'product.unitSalePrice'),
        size: getProp(lineItem, 'product.size')
      })
    })
  }

  getRecommendationContext (event) {
    return cleanObject({
      type: this.getContextType(event),
      data: this.getContextData(event)
    })
  }

  getContextType (event) {
    return {
      [VIEWED_PAGE]: getProp(event, 'page.type') === 'home' ? HOME_PAGE_TYPE : OTHER_PAGE_TYPE,
      [VIEWED_PRODUCT_DETAIL]: PRODUCT_PAGE_TYPE,
      [VIEWED_PRODUCT_LISTING]: LISTING_PAGE_TYPE,
      [VIEWED_CART]: CART_PAGE_TYPE
    }[event.name]
  }

  getContextData (event) {
    return {
      [VIEWED_PRODUCT_DETAIL]: [this.getProductId(getProp(event, 'product'))],
      [VIEWED_PRODUCT_LISTING]: getProp(event, 'listing.category'),
      [VIEWED_CART]: this.getLineItemIds(getProp(event, 'cart.lineItems') || [])
    }[event.name]
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [LOGGED_IN]: 'onLoggedIn',
      [REGISTERED]: 'onRegistered',
      [SUBSCRIBED]: 'onSubscribed'
    }

    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedPage (event) {
    setTimeout(() => {
    // trigger 'HOMEPAGE' for home page and 'OTHER' for all the rest pages
      if (!this.pageTracked) {
        this.trackPage(this.getRecommendationContext(event))
      }
    }, 100)
  }

  onViewedProductDetail (event) {
    const context = this.getRecommendationContext(event)
    this.trackPage(context)
  }

  onViewedProductListing (event) {
    const context = this.getRecommendationContext(event)
    this.trackPage(context)
  }

  onViewedCart (event) {
    const context = this.getRecommendationContext(event)
    this.trackPage(context)
  }

  onAddedProduct (event) {
    this.asyncQueue.push(() => {
      window.DY.API('event', {
        name: 'Add to Cart',
        properties: {
          dyType: 'add-to-cart-v1',
          value: getProp(event, 'cart.total'),
          currency: getProp(event, 'cart.currency'),
          productId: getProp(event, 'product.id'),
          quantity: getProp(event, 'quantity'),
          cart: this.getLineItems(getProp(event, 'cart.lineItems') || [])
        }
      })
    })
  }

  onCompletedTransaction (event) {
    this.asyncQueue.push(() => {
      window.DY.API('event', {
        name: 'Purchase',
        properties: {
          dyType: 'purchase-v1',
          uniqueTransactionId: getProp(event, 'transaction.orderId'),
          value: getProp(event, 'transaction.total'),
          currency: getProp(event, 'transaction.currency'),
          cart: this.getLineItems(getProp(event, 'transaction.lineItems'))
        }
      })
    })
  }

  onLoggedIn (event) {
    this.asyncQueue.push(() => {
      window.DY.API('event', {
        name: 'Login',
        properties: {
          dyType: 'login-v1',
          hashedEmail: sha256(getProp(event, 'user.email')).toString(),
          cuid: getProp(event, 'user.userId'),
          cuidType: 'userId'
        }
      })
    })
  }

  onRegistered (event) {
    this.asyncQueue.push(() => {
      window.DY.API('event', {
        name: 'Signup',
        properties: {
          dyType: 'signup-v1',
          hashedEmail: sha256(getProp(event, 'user.email')).toString(),
          cuid: getProp(event, 'user.userId'),
          cuidType: 'userId'
        }
      })
    })
  }

  onSubscribed (event) {
    this.asyncQueue.push(() => {
      window.DY.API('event', {
        name: 'Newsletter Subscription',
        properties: {
          dyType: 'newsletter-subscription-v1',
          hashedEmail: sha256(getProp(event, 'user.email')).toString()
        }
      })
    })
  }
}

export default DynamicYield
