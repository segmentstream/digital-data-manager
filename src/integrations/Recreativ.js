import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'
import {
  VIEWED_PRODUCT_DETAIL,
  VIEWED_CART,
  COMPLETED_TRANSACTION
} from '../events/semanticEvents'

const SEMANTIC_EVENTS = [
  VIEWED_PRODUCT_DETAIL,
  VIEWED_CART,
  COMPLETED_TRANSACTION
]

class Recreativ extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      shopId: ''
    }, options)

    super(digitalData, optionsWithDefaults)

    this._isLoaded = false

    this.addTag('product', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//recreativ.ru/trck.php?shop=${options.shopId}&offer={{ productId }}&rnd=${Math.floor(Math.random() * 999)}`
      }
    })

    this.addTag('cart', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//recreativ.ru/trck.php?shop=${options.shopId}&cart={{ productIds }}&rnd=${Math.floor(Math.random() * 999)}`
      }
    })

    this.addTag('transaction', {
      type: 'script',
      attr: {
        // eslint-disable-next-line max-len
        src: `//recreativ.ru/trck.php?shop=${options.shopId}&del={{ productIds }}&rnd=${Math.floor(Math.random() * 999)}`
      }
    })
  }

  getSemanticEvents () {
    return SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    let enrichableProps

    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product.id'
        ]
        break
      case VIEWED_CART:
        enrichableProps = [
          'cart'
        ]
        break
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          'transaction'
        ]
        break
      default:
        enrichableProps = []
        break
    }

    return enrichableProps
  }

  getEventValidationConfig (event) {
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
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
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.lineItems[].product.id'
        ],
        validation: {
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      }
    }

    return config[event.name]
  }

  initialize () {
    this._isLoaded = true
  }

  isLoaded () {
    return this._isLoaded
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction'
    }

    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedProductDetail (event) {
    const { product } = event
    if (product && product.id) {
      this.load('product', {
        productId: product.id
      })
    }
  }

  onViewedCart (event) {
    const { cart } = event
    if (!getProp(cart, 'lineItems.length')) return
    const productIds = cart.lineItems.reduce((str, lineItem, index) => {
      const productId = getProp(lineItem, 'product.id')
      if (index > 0) {
        return [str, productId].join(',')
      }
      return productId
    }, '')

    this.load('cart', { productIds })
  }

  onCompletedTransaction (event) {
    const { transaction } = event
    if (!getProp(transaction, 'lineItems.length')) return
    const productIds = transaction.lineItems.reduce((str, lineItem, index) => {
      const productId = getProp(lineItem, 'product.id')
      if (index > 0) {
        return [str, productId].join(',')
      }
      return productId
    }, '')

    this.load('transaction', { productIds })
  }
}

export default Recreativ
