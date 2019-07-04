import deleteProperty from '@segmentstream/utils/deleteProperty'
import cleanObject from '@segmentstream/utils/cleanObject'
import arrayMerge from '@segmentstream/utils/arrayMerge'
import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  ADDED_PRODUCT_TO_WISHLIST,
  COMPLETED_TRANSACTION,
  STARTED_ORDER
} from '../events/semanticEvents'
import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues
} from '../IntegrationUtils'

const FB_STANDARD_EVENTS = [
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration'
]

function getProductCategory (product) {
  let { category } = product
  if (Array.isArray(category)) {
    category = category.join('/')
  } else if (category && product.subcategory) {
    category = `${category}/${product.subcategory}`
  }
  return category
}

class FacebookPixel extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
      usePriceAsEventValue: false,
      feedWithGroupedProducts: false,
      customEvents: {},
      eventParameters: {}
    }, options)

    super(digitalData, optionsWithDefaults)

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      ADDED_PRODUCT_TO_WISHLIST,
      SEARCHED_PRODUCTS,
      STARTED_ORDER,
      COMPLETED_TRANSACTION
    ]

    this.customEvents = Object.keys(this.getOption('customEvents') || {})
    this.customEvents.forEach((customEvent) => {
      if (this.SEMANTIC_EVENTS.indexOf(customEvent) < 0) {
        this.SEMANTIC_EVENTS.push(customEvent)
      }
    })

    this.addTag({
      type: 'script',
      attr: {
        src: '//connect.facebook.net/en_US/fbevents.js'
      }
    })
  }

  initialize () {
    // non-documented support for multiple facebook ids (if comma-separated)
    const pixelIds = this.getOption('pixelId')
    if (pixelIds && !window.fbq) {
      window.fbq = window._fbq = function fbq () {
        if (window.fbq.callMethod) {
          window.fbq.callMethod(...arguments)
        } else {
          window.fbq.queue.push(arguments)
        }
      }
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = '2.0'
      window.fbq.queue = []

      pixelIds.split(',').forEach((pixelId) => {
        window.fbq('init', pixelId)
      })
    }
  }

  getPixelIds () {
    return this.getOption('pixelId').split(',')
  }

  getSemanticEvents () {
    return this.SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    let enrichableProps = getEnrichableVariableMappingProps(this.getOption('eventParameters'))
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        arrayMerge(enrichableProps, [
          'product'
        ])
        break
      case SEARCHED_PRODUCTS:
        arrayMerge(enrichableProps, [
          'listing.query'
        ])
        break
      case STARTED_ORDER:
        arrayMerge(enrichableProps, [
          'cart'
        ])
        break
      case COMPLETED_TRANSACTION:
        arrayMerge(enrichableProps, [
          'website.currency',
          'transaction'
        ])
        break
      default:
        // do nothing
    }
    return enrichableProps
  }

  getEventValidationConfig (event) {
    const productFields = ['product.id', 'product.name', 'product.category']
    const productValidations = {
      'product.id': {
        errors: ['required'],
        warnings: ['string']
      },
      'product.name': {
        warnings: ['required', 'string']
      },
      'product.category': {
        warnings: ['required', 'array']
      }
    }
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: productFields,
        validations: productValidations
      },
      [ADDED_PRODUCT]: {
        fields: productFields,
        validations: productValidations
      },
      [ADDED_PRODUCT_TO_WISHLIST]: {
        fields: productFields,
        validations: productValidations
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.query'],
        validations: {
          'listing.query': {
            errors: ['required']
          }
        }
      },
      [STARTED_ORDER]: {
        fields: [
          'cart.total',
          'cart.currency',
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.skuCode'
        ],
        validations: {
          'cart.total': {
            errors: ['numeric']
          },
          'cart.currency': {
            errors: ['string']
          },
          'cart.lineItems[].product.id': {
            warnings: ['string']
          },
          'cart.lineItems[].product.skuCode': {
            warnings: ['string']
          }
        }
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.total',
          'transaction.currency',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.skuCode'
        ],
        validations: {
          'transaction.total': {
            errors: ['required', 'numeric']
          },
          'transaction.currency': {
            errors: ['required', 'string']
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          },
          'transaction.lineItems[].product.skuCode': {
            warnings: ['string']
          }
        }
      }
    }

    return config[event.name]
  }

  isLoaded () {
    return !!(window.fbq && window.fbq.callMethod)
  }

  reset () {
    deleteProperty(window, 'fbq')
  }

  trackEvent (event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage()
    } else if (event.name === VIEWED_PRODUCT_DETAIL) {
      this.onViewedProductDetail(event)
    } else if (event.name === ADDED_PRODUCT) {
      this.onAddedProduct(event)
    } else if (event.name === ADDED_PRODUCT_TO_WISHLIST) {
      this.onAddedProductToWishlist(event)
    } else if (event.name === SEARCHED_PRODUCTS) {
      this.onSearchedProducts(event)
    } else if (event.name === STARTED_ORDER) {
      this.onStartedOrder(event)
    } else if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event)
    } else {
      this.onCustomEvent(event)
    }
  }

  getEventParams (event) {
    return extractVariableMappingValues(event, this.getOption('eventParameters'))
  }

  getProductParams (event) {
    const product = event.product || {}
    const category = getProductCategory(product)
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts')
    const value = this.getOption('usePriceAsEventValue') ? product.unitSalePrice : event.value
    const currency = this.getOption('usePriceAsEventValue') ? product.currency : undefined
    return cleanObject({
      content_ids: [product.id || ''],
      content_type: (feedWithGroupedProducts) ? 'product_group' : 'product',
      content_name: product.name || '',
      content_category: category || '',
      value,
      currency
    })
  }

  trackSingle (eventName, params) {
    this.getPixelIds().forEach(pixelId => window.fbq('trackSingle', pixelId, eventName, params))
  }

  trackSingleCustom (eventName, params) {
    this.getPixelIds().forEach(pixelId => window.fbq('trackSingleCustom', pixelId, eventName, params))
  }

  onViewedPage () {
    this.trackSingle('PageView')
  }

  onViewedProductDetail (event) {
    const productParams = this.getProductParams(event)
    const eventParams = this.getEventParams(event)

    this.trackSingle('ViewContent', Object.assign(productParams, eventParams))
  }

  onAddedProduct (event) {
    const productParams = this.getProductParams(event)
    const eventParams = this.getEventParams(event)

    this.trackSingle('AddToCart', Object.assign(productParams, eventParams))
  }

  onAddedProductToWishlist (event) {
    const productParams = this.getProductParams(event)
    const eventParams = this.getEventParams(event)

    this.trackSingle('AddToWishlist', Object.assign(productParams, eventParams))
  }

  onSearchedProducts (event) {
    const listing = event.listing || {}
    const searchListingParams = cleanObject({
      search_string: listing.query
    })
    const eventParams = this.getEventParams(event)
    this.trackSingle('Search', Object.assign(searchListingParams, eventParams))
  }

  onStartedOrder (event) {
    const cart = event.cart || {}
    const lineItems = cart.lineItems || []
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts')
    const value = this.getOption('usePriceAsEventValue') ? cart.total : event.value
    const idProp = (feedWithGroupedProducts) ? 'product.skuCode' : 'product.id'
    const contentIds = lineItems.length
      ? lineItems.map(lineItem => getProp(lineItem, idProp)) : undefined
    const cartParams = cleanObject({
      content_ids: contentIds,
      content_type: 'product',
      currency: cart.currency,
      value
    })
    const eventParams = this.getEventParams(event)

    this.trackSingle('InitiateCheckout', Object.assign(cartParams, eventParams))
  }

  onCompletedTransaction (event) {
    const transaction = event.transaction || {}
    const lineItems = transaction.lineItems || []
    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts')
    const idProp = (feedWithGroupedProducts) ? 'product.skuCode' : 'product.id'
    const contentIds = lineItems.length
      ? transaction.lineItems.map(lineItem => getProp(lineItem, idProp)) : undefined
    const transactionParams = cleanObject({
      content_ids: contentIds,
      content_type: 'product',
      currency: transaction.currency,
      value: transaction.total
    })
    const eventParams = this.getEventParams(event)

    this.trackSingle('Purchase', Object.assign(transactionParams, eventParams))
  }

  onCustomEvent (event) {
    const customEvents = this.getOption('customEvents')
    const customEventName = customEvents[event.name]
    const eventParams = this.getEventParams(event)
    if (customEventName) {
      if (FB_STANDARD_EVENTS.indexOf(customEventName) < 0) {
        this.trackSingleCustom(customEventName, eventParams)
      } else {
        this.trackSingle(customEventName, eventParams)
      }
    }
  }
}

export default FacebookPixel
