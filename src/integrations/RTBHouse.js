import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  STARTED_ORDER,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
  UPDATED_CART
} from '../events/semanticEvents'

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  STARTED_ORDER,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
  UPDATED_CART
]

const DEFAULT_DEDUPLICATION = 'default'
const RTBHOUSE_UTM_SOURCE = 'rtbhouse'

class RTBHouse extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      accountKey: '',
      customDeduplication: false,
      userSegmentVar: undefined
    }, options)

    super(digitalData, optionsWithDefaults)

    this._isLoaded = false

    this.addTag({
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}{{ userSegmentParams }}`
      }
    })
    this.addTag('home', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_home{{ userSegmentParams }}`
      }
    })
    this.addTag('category2', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_category2_{{ categoryId }}{{ userSegmentParams }}`
      }
    })
    this.addTag('offer', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_offer_{{ productId }}{{ userSegmentParams }}`
      }
    })
    this.addTag('listing', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_listing_{{ productIds }}{{ userSegmentParams }}`
      }
    })
    this.addTag('basketadd', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: '//creativecdn.com/tags?type=script&id=pr_VB82iQFyqcxTg1HWJlJM_basketadd_{{ productId }}{{ userSegmentParams }}'
      }
    })
    this.addTag('basketstatus', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_basketstatus_{{ productIds }}{{ userSegmentParams }}`
      }
    })
    this.addTag('startorder', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_startorder{{ userSegmentParams }}`
      }
    })
    this.addTag('orderstatus2', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_orderstatus2_{{ total }}_{{ orderId }}_{{ productIds }}&cd={{ deduplication }}{{ userSegmentParams }}`
      }
    })
  }

  getSemanticEvents () {
    return SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    let enrichableProps

    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'page.type'
        ]
        break
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product.id'
        ]
        break
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          'listing.categoryId'
        ]
        break
      case SEARCHED_PRODUCTS:
        enrichableProps = [
          'listing.items'
        ]
        break
      case VIEWED_CART:
        enrichableProps = [
          'cart'
        ]
        break
      case UPDATED_CART:
        enrichableProps = [
          'cart'
        ]
        break
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'context.campaign',
          'transaction'
        ]
        break
      default:
        enrichableProps = []
        break
    }

    const userSegmentVar = this.getOption('userSegmentVar')
    if (userSegmentVar) {
      enrichableProps.push(userSegmentVar)
    }

    return enrichableProps
  }

  getEventValidationConfig (event) {
    const listingValidations = {}
    const listingFields = []
    const listingItemsCount = getProp(event, 'listing.items.length') || 0
    for (let i = 0; i < Math.min(listingItemsCount, 5); i += 1) {
      const fieldName = ['listing.items', i, 'id'].join('.')
      listingFields.push(fieldName)
      listingValidations[fieldName] = {
        errors: ['required'],
        warnings: ['string']
      }
    }

    const config = {
      [VIEWED_PAGE]: {
        fields: ['page.type'],
        validations: {
          'page.type': {
            errors: ['required', 'string']
          }
        }
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      },
      [SEARCHED_PRODUCTS]: {
        fields: listingFields,
        validations: listingValidations
      },
      [VIEWED_CART]: {
        fields: ['cart.lineItems[].product.id'],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      },
      [UPDATED_CART]: {
        fields: ['cart.lineItems[].product.id'],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'transaction.lineItems[].product.id'
        ],
        validation: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string']
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric']
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      }
    }

    let validationConfig = config[event.name]
    const userSegmentVar = this.getOption('userSegmentVar')

    if (userSegmentVar) {
      if (!validationConfig) {
        validationConfig = {
          fields: [userSegmentVar]
        }
      } else {
        validationConfig.fields = validationConfig.fields || []
        validationConfig.fields.push(userSegmentVar)
      }
    }

    return validationConfig
  }

  getUserSegmentParams (event) {
    const userSegmentVar = this.getOption('userSegmentVar')
    let userSegment
    if (userSegmentVar) {
      userSegment = getProp(event, userSegmentVar)
    }
    if (userSegment !== undefined) {
      return `&id1=pr_${this.getOption('accountKey')}_custom_user_${userSegment}`
    }
    return ''
  }

  initialize () {
    this._isLoaded = true
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
      [STARTED_ORDER]: 'onStartedOrder',
      [VIEWED_CART]: 'onViewedCart',
      [UPDATED_CART]: 'onUpdatedCart'
    }

    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedPage (event) {
    const { page } = event

    if (page && page.type === 'home') {
      this.onViewedHome(event)
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOther(event)
        }
      }, 100)
    }
  }

  onViewedCart (event) {
    const { cart } = event
    if (!cart || !cart.lineItems || !cart.lineItems.length) return
    const productIds = cart.lineItems.reduce((str, lineItem, index) => {
      const productId = getProp(lineItem, 'product.id')
      if (index > 0) {
        return [str, productId].join(',')
      }
      return productId
    }, '')
    this.load('basketstatus', {
      productIds,
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onUpdatedCart (event) {
    const { cart } = event
    if (!cart || !cart.lineItems || !cart.lineItems.length) return
    const productIds = cart.lineItems.reduce((str, lineItem, index) => {
      const productId = getProp(lineItem, 'product.id')
      if (index > 0) {
        return [str, productId].join(',')
      }
      return productId
    }, '')
    this.load('basketstatus', {
      productIds,
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onViewedHome (event) {
    this.load('home', {
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onViewedOther (event) {
    this.load({
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onViewedProductListing (event) {
    const { listing } = event
    if (!listing || !listing.categoryId) return

    this.load('category2', {
      categoryId: listing.categoryId,
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onSearchedProducts (event) {
    const { listing } = event
    if (!listing || !listing.items || !listing.items.length) return

    const productIds = listing.items.reduce((str, product, index) => {
      if (index > 0) {
        if (index < 5) {
          return [str, product.id].join(',')
        }
        return str
      }
      return product.id
    }, '')

    this.load('listing', {
      productIds,
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onViewedProductDetail (event) {
    const { product } = event
    if (product && product.id) {
      this.load('offer', {
        productId: product.id,
        userSegmentParams: this.getUserSegmentParams(event)
      })
      this.pageTracked = true
    }
  }

  /*
  onAddedProduct(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('basketadd', { productId: product.id });
      this.pageTracked = true;
    }
  } */

  onStartedOrder (event) {
    this.load('startorder', {
      userSegmentParams: this.getUserSegmentParams(event)
    })
    this.pageTracked = true
  }

  onCompletedTransaction (event) {
    const { transaction } = event
    if (
      transaction && transaction.orderId && transaction.lineItems &&
      transaction.lineItems.length > 0
    ) {
      const { orderId, total } = transaction
      const productIds = transaction.lineItems.reduce((str, lineItem, index) => {
        const productId = getProp(lineItem, 'product.id')
        if (index > 0) {
          return [str, productId].join(',')
        }
        return productId
      }, '')

      let deduplication = DEFAULT_DEDUPLICATION
      if (this.getOption('customDeduplication')) {
        const currentSource = getProp(event, 'context.campaign.source')
        if (currentSource === RTBHOUSE_UTM_SOURCE) {
          deduplication = false
        } else {
          deduplication = true
        }
      }

      this.load('orderstatus2', {
        productIds,
        orderId,
        total,
        deduplication,
        userSegmentParams: this.getUserSegmentParams(event)
      })
      this.pageTracked = true
    }
  }
}

export default RTBHouse
