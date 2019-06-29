import getQueryParam from '@segmentstream/utils/getQueryParam'
import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'
import { isDeduplication, addAffiliateCookie, getAffiliateCookie } from './utils/affiliate'

import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
  VIEWED_CART
} from '../events/semanticEvents'

const DEFAULT_UTM_SOURCE = 'gdeslon'
const COOKIE_TTL_URL_PARAM = '_gs_cttl'
const CLICK_REF_URL_PARAM = '_gs_ref'
const AID_URL_PARAM = 'gsaid'
const DEFAULT_CLICK_REF_COOKIE_NAME = 'gdeslon_ref'
const DEFAULT_AID_COOKIE_NAME = 'gdeslon_aid'

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
  VIEWED_CART
]

class GdeSlon extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      merchantId: '',
      defaultCode: '',
      clickRefCookieName: DEFAULT_CLICK_REF_COOKIE_NAME,
      aidCookieName: DEFAULT_AID_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: '',
      deduplication: false,
      utmSource: DEFAULT_UTM_SOURCE, // utm_source for mixmarket leads
      deduplicationUtmMedium: [],
      isRetargetingEnabled: false,
      feedWithGroupedProducts: false
    }, options)

    super(digitalData, optionsWithDefaults)

    this._isLoaded = false

    // default
    this.addTag('trackingPixel', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `https://www.gdeslon.ru/thanks.js?codes={{ productCodes }}{{ code }}:{{ total }}&order_id={{ orderId }}&merchant_id=${options.merchantId}`
      }
    })

    // retargeting
    this.addTag('thanks', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `https://www.gdeslon.ru/landing.js?codes={{ productCodes }}&order_id={{ orderId }}&mid=${options.merchantId}&mode=thanks`
      }
    })

    this.addTag('other', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/landing.js?mid=${options.merchantId}&mode=other`
      }
    })

    this.addTag('main', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/landing.js?mid=${options.merchantId}&mode=main`
      }
    })

    this.addTag('card', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/landing.js?codes={{ productCodes }}&mid=${options.merchantId}&mode=card`
      }
    })

    this.addTag('basket', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/landing.js?codes={{ productCodes }}&mid=${options.merchantId}&mode=basket`
      }
    })

    this.addTag('search list', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/landing.js?codes={{ productCodes }}&mid=${options.merchantId}&mode=list`
      }
    })

    this.addTag('category', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `https://www.gdeslon.ru/landing.js?codes={{ productCodes }}&cat_id={{ categoryId }}&mid=${options.merchantId}&mode=list`
      }
    })
  }

  initialize () {
    this._isLoaded = true

    if (this.getOption('cookieTracking')) {
      const clickRef = getQueryParam(CLICK_REF_URL_PARAM)
      const aid = getQueryParam(AID_URL_PARAM)
      const expires = Number(getQueryParam(COOKIE_TTL_URL_PARAM))
      const domain = this.getOption('cookieDomain')
      if (clickRef) {
        const clickRefCookieName = this.getOption('clickRefCookieName')
        addAffiliateCookie(clickRefCookieName, clickRef, expires, domain)
      }
      if (aid) {
        const aidCookieName = this.getOption('aidCookieName')
        addAffiliateCookie(aidCookieName, aid, expires, domain)
      }
    }
  }

  getSemanticEvents () {
    if (this.getOption('isRetargetingEnabled')) {
      return SEMANTIC_EVENTS
    }
    return [COMPLETED_TRANSACTION]
  }

  getEnrichableEventProps (event) {
    let enrichableProps = []
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'page.type'
        ]
        break
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product'
        ]
        break
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          'listing.items',
          'listing.categoryId'
        ]
        break
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'listing.items',
          'listing.categoryId'
        ]
        break
      case VIEWED_CART:
        enrichableProps = [
          'cart'
        ]
        break
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'transaction',
          'context.campaign'
        ]
        break

      default:
        enrichableProps = []
    }

    return enrichableProps
  }

  getEventValidationConfig (event) {
    const config = {
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.gdeslon.code'
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string']
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric']
          }
        }
      }
    }

    return config[event.name]
  }

  isLoaded () {
    return this._isLoaded
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_CART]: 'onViewedCart'
    }

    const method = methods[event.name]

    if (method) {
      this[method](event)
    }
  }

  onViewedPage (event) {
    if (!this.getOption('isRetargetingEnabled')) return

    const { page } = event

    if (page && page.type === 'home') {
      this.onViewedHome()
    }

    setTimeout(() => {
      if (!this.pageTracked) {
        this.onViewedOther()
      }
    }, 100)
  }

  onViewedOther () {
    this.load('other')
    this.pageTracked = true
  }

  onViewedHome () {
    this.load('main')
    this.pageTracked = true
  }

  onViewedProductDetail (event) {
    const { product } = event
    const productCodes = this.formatProductCodes([{ product }])

    this.load('card', { productCodes })
    this.pageTracked = true
  }

  onViewedCart (event) {
    const { lineItems } = event.cart
    const productCodes = this.formatProductCodes(lineItems)

    this.load('basket', { productCodes })
    this.pageTracked = true
  }

  onSearchedProducts (event) {
    const productCodes = this.formatProductCodes(getProp(event, 'listing.items'))

    this.load('search list', { productCodes })
    this.pageTracked = true
  }

  onViewedProductListing (event) {
    const productCodes = this.formatProductCodes(getProp(event, 'listing.items'))
    const { categoryId } = event.listing

    this.load('category', { productCodes, categoryId })
    this.pageTracked = true
  }

  onCompletedTransaction (event) {
    this.trackCompletedTransactionRetargeting(event)
    this.pageTracked = true

    if (!getAffiliateCookie(this.getOption('clickRefCookieName'))) return
    const campaign = getProp(event, 'context.campaign')
    const utmSource = this.getOption('utmSource')
    const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium')
    if (isDeduplication(campaign, utmSource, deduplicationUtmMedium)) return

    this.trackSale(event)
  }

  formatProductCodes (items) {
    let productCodes = ''
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts')
    if (Array.isArray(items)) {
      productCodes = items.reduce((acc, lineItem) => {
        const product = lineItem.product || lineItem || {}
        const quantity = lineItem.quantity || 1
        const productId = (!feedWithGroupedProducts) ? product.id : product.skuCode
        let newVal = [productId, product.unitSalePrice].join(':')
        if (quantity > 1) {
          newVal = Array(quantity).fill(newVal).join(',')
        }
        if (acc) {
          return [acc, newVal].join(',')
        }
        return newVal
      }, '')
    }

    return productCodes
  }

  getCode (event) {
    return getProp(event, 'integrations.gdeslon.code') || this.getOption('defaultCode')
  }

  trackCompletedTransactionRetargeting (event) {
    if (!this.getOption('isRetargetingEnabled')) return

    const { transaction } = event

    if (!transaction || !transaction.orderId || !transaction.total) {
      return
    }

    const { orderId } = transaction

    const productCodes = this.formatProductCodes(transaction.lineItems)

    if (this.getOption('isRetargetingEnabled')) {
      this.load('thanks', {
        productCodes, orderId
      })
    }
  }

  trackSale (event) {
    const { transaction } = event

    if (!transaction || !transaction.orderId || !transaction.total) {
      return
    }

    const { orderId, total } = transaction

    let productCodes = this.formatProductCodes(transaction.lineItems)
    if (productCodes) productCodes += ','

    const code = this.getCode(event)

    this.load('trackingPixel', {
      productCodes, code, orderId, total
    })
  }
}

export default GdeSlon
