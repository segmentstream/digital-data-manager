import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION
} from '../events/semanticEvents'
import AsyncQueue from './utils/AsyncQueue'

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION
]

class TargetToSell extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      clientId: undefined,
      feedWithGroupedProducts: false,
      hasRankOption: true
    }, options)

    super(digitalData, optionsWithDefaults)

    this.addTag('trackingScript', {
      type: 'script',
      attr: {
        type: 'text/javascript',
        async: true,
        src: 'https://static.target2sell.com/t2s.min.js'
      }
    })
  }

  initialize () {
    this.asyncQueue = new AsyncQueue(() => !!window.T2S)
    this._isLoaded = true
  }

  target2SellApiCall (params) {
    this.pageTracked = true
    if (!this.trackingScriptLoaded) {
      window._t2sparams = params
      this.load('trackingScript')
      this.trackingScriptLoaded = true
    } else {
      this.asyncQueue.push(() => {
        window._t2sparams = params
        window.T2S._sendTracking()
      })
    }
  }

  getSemanticEvents () {
    return SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    let enrichableProps = []
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email'
        ]
        break
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email',
          'product'
        ]
        break
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email',
          'listing.items'
        ]
        break
      case VIEWED_CART:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email',
          'cart'
        ]
        break
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email',
          'listing.items',
          'page.queryString'
        ]
        break
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'page.type',
          'user.userId',
          'user.email',
          'transaction'
        ]
        break
      default:
      // do nothing
    }
    return enrichableProps
  }

  prepareParams (event, eventType) {
    return {
      eN: eventType || 'view',
      cID: this.getOption('clientId'),
      pID: this.getPageId(event),
      uEM: event.email,
      uID: event.userId,
      hasRankOption: this.getOption('hasRankOption')
    }
  }

  getPageId (event) {
    return {
      [VIEWED_PAGE]: getProp(event, 'page.type') === 'home' ? '1000' : '2200',
      [VIEWED_PRODUCT_DETAIL]: '1200',
      [VIEWED_PRODUCT_LISTING]: '1400',
      [VIEWED_CART]: '1600',
      [SEARCHED_PRODUCTS]: (getProp(event, 'listing.items') || []).length > 0 ? '2000' : '3400',
      [COMPLETED_TRANSACTION]: '2400'
    }[event.name]
  }

  getProductIds (items) {
    const withSku = this.getOption('feedWithGroupedProducts')
    return items.map(item => item[withSku ? 'skuCode' : 'id']).join('|')
  }

  getProductFields (items, field) {
    return items.map(item => item[field]).join('|')
  }

  getSearchString (queryString) {
    const index = queryString.indexOf('=') + 1
    return index > 0 ? queryString.substr(index) : ''
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction'
    }

    const method = methods[event.name]
    if (method) this[method](event)
  }

  onViewedPage (event) {
    this.pageTracked = false
    setTimeout(() => {
      // trigger 'home' for home page and 'content' for all the rest pages
      if (!this.pageTracked) this.target2SellApiCall(this.prepareParams(event))
    }, 100)
  }

  onViewedProductDetail (event) {
    const params = this.prepareParams(event)

    params.iID = this.getProductIds([event.product])
    this.target2SellApiCall(params)
  }

  onViewedProductListing (event) {
    const params = this.prepareParams(event)
    const items = getProp(event, 'listing.items') || []

    params.iID = this.getProductIds(items)
    this.target2SellApiCall(params)
  }

  onViewedCart (event) {
    const params = this.prepareParams(event)
    const items = getProp(event, 'cart.lineItems')

    params.iID = this.getProductIds(items.map(item => item.product))
    params.qTE = this.getProductFields(items, 'quantity')
    this.target2SellApiCall(params)
  }

  onSearchedProducts (event) {
    const params = this.prepareParams(event)
    const items = getProp(event, 'listing.items') || []
    const queryString = getProp(event, 'page.queryString')

    if (items.length > 0) params.iID = this.getProductIds(items)
    params.kw = this.getSearchString(queryString)
    this.target2SellApiCall(params)
  }

  onCompletedTransaction (event) {
    const params = this.prepareParams(event)
    const items = getProp(event, 'transaction.lineItems') || []

    params.iID = this.getProductIds(items.map(item => item.product))
    params.bS = String(getProp(event, 'transaction.total'))
    params.qTE = this.getProductFields(items, 'quantity')
    params.oID = getProp(event, 'transaction.orderId')
    params.priceL = this.getProductFields(items, 'subtotal')

    this.target2SellApiCall(params)
  }
}

export default TargetToSell
