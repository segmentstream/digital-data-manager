import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import {
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  COMPLETED_TRANSACTION
} from '../events/semanticEvents'

const mapProduct = product => cleanObject({
  id: product.id,
  name: product.name,
  brand: product.manufacturer || product.brand,
  category: Array.isArray(product.category) ? product.category.join('/') : product.category,
  variant: product.variant,
  currency: product.currency,
  price: product.unitSalePrice
})

class Adnetic extends Integration {
  constructor (digitalData, options) {
    super(digitalData, options)

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://shopnetic.com/js/embed/loader.js'
      }
    })
  }

  getEnrichableEventProps (event) {
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        return ['product']
      case COMPLETED_TRANSACTION:
        return ['transaction']
      default:
        return []
    }
  }

  getEventValidationConfig (event) {
    const productFields = [
      'product.id',
      'product.name',
      'product.manufacturer',
      'product.category',
      'product.variant',
      'product.currency',
      'product.unitSalePrice'
    ]
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: productFields
      },
      [ADDED_PRODUCT]: {
        fields: productFields
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.manufacturer',
          'transaction.lineItems[].product.category',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].product.currency',
          'transaction.lineItems[].product.variant'
        ]
      }
    }

    return config[event.name]
  }

  getSemanticEvents () {
    return [
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      COMPLETED_TRANSACTION
    ]
  }

  initialize () {
    !function(n,u,t){n[u]||(n[u]={}),n[u][t]||(n[u][t]=function(){n[u].q||(n[u].q=[]),n[u].q.push(arguments)})}(window,'antc','run'); // eslint-disable-line
  }

  isLoaded () {
    return false
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction'
    }

    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedProductDetail (event) {
    const product = event.product || {}
    window.antc.run('antc.track.ecommerce', 'detail', mapProduct(product))
  }

  onAddedProduct (event) {
    const product = event.product || {}
    window.antc.run('antc.track.ecommerce', 'add', mapProduct(product))
  }

  onCompletedTransaction (event) {
    const transaction = event.transaction || {}
    const lineItems = transaction.lineItems || []

    lineItems.forEach((lineItem) => {
      const product = lineItem.product || {}
      window.antc.run('antc.track.ecommerce', 'purchase', mapProduct(product))
    })
  }
}

export default Adnetic
