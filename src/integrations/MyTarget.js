import deleteProperty from '@segmentstream/utils/deleteProperty'
import getVarValue from '@segmentstream/utils/getVarValue'
import { getProp } from '@segmentstream/utils/dotProp'
import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import { DIGITALDATA_VAR, CONSTANT_VAR } from '../variableTypes'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  ADDED_PRODUCT,
  COMPLETED_TRANSACTION
} from '../events/semanticEvents'

function lineItemsToProductIds (lineItems, feedWithGroupedProducts) {
  const productIds = lineItems
    .filter(lineItem => !!(lineItem.product.id))
    .map(lineItem => ((feedWithGroupedProducts !== true) ? lineItem.product.id : lineItem.product.skuCode))
  return productIds
}

class MyTarget extends Integration {
  constructor (digitalData, options) {
    const counters = getProp(options, 'counters')
    if (counters) {
      options.counters = counters.map(item => ({
        counterId: '',
        listVar: {
          type: CONSTANT_VAR,
          value: '1'
        },
        feedWithGroupedProducts: false,
        ...item
      }))
    }

    const optionsWithDefaults = Object.assign({
      counters: [],
      noConflict: false,
      goals: {}
    }, options)

    super(digitalData, optionsWithDefaults)

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      ADDED_PRODUCT,
      VIEWED_CART,
      COMPLETED_TRANSACTION
    ]
    this.addGoalsToSemanticEvents()

    this.addTag({
      type: 'script',
      attr: {
        id: 'topmailru-code',
        src: '//top-fwz1.mail.ru/js/code.js'
      }
    })
  }

  getCounters () {
    return this.getOption('counters')
  }

  getDigitalDataListVarValues () {
    return this.getCounters()
      .map(counter => counter.listVar) // get listVar from all counters
      .filter(listVar => (listVar && listVar.type === DIGITALDATA_VAR)) // filter by type
      .map(listVar => listVar.value) // get value field
      .filter((item, index, array) => array.indexOf(item) === index) // unique
  }

  initialize () {
    window._tmr = window._tmr || []
  }

  allowNoConflictInitialization () {
    return true
  }

  addGoalsToSemanticEvents () {
    const goalEvents = Object.keys(this.getOption('goals'))
    goalEvents.forEach((goalEvent) => {
      if (this.SEMANTIC_EVENTS.indexOf(goalEvent) < 0) {
        this.SEMANTIC_EVENTS.push(goalEvent)
      }
    })
  }

  getSemanticEvents () {
    return this.SEMANTIC_EVENTS
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
      case ADDED_PRODUCT:
        enrichableProps = [
          'product'
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
      // do nothing
    }

    this.getDigitalDataListVarValues().forEach(listVarValue => enrichableProps.push(listVarValue))

    return enrichableProps
  }

  getEventValidationConfig (event) {
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
        fields: ['product.id', 'product.unitSalePrice'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string']
          },
          'product.unitSalePrice': {
            warings: ['required', 'numeric']
          }
        }
      },
      [VIEWED_CART]: {
        fields: ['cart.total', 'cart.lineItems[].product.id'],
        validations: {
          'cart.total': {
            errors: ['required'],
            warnings: ['numeric']
          },
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string']
          }
        }
      },
      [COMPLETED_TRANSACTION]: {
        fields: ['transaction.total', 'transaction.lineItems[].product.id'],
        validations: {
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

    const validationConfig = config[event.name]

    if (validationConfig) {
      // check if listVar presents in event
      this.getDigitalDataListVarValues().forEach((listVarValue) => {
        validationConfig.fields.push('listVar.value')
        validationConfig.validations[listVarValue] = {
          errors: ['required'],
          warnings: ['numeric']
        }
      })
    }

    return validationConfig
  }

  isLoaded () {
    return !!(window._tmr && window._tmr.unload)
  }

  reset () {
    deleteProperty(window, '_tmr')
  }

  getList (event, counter) {
    const listVar = getProp(counter, 'listVar')
    if (listVar) {
      return getVarValue(listVar, event)
    }
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductCategory',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction'
    }

    const method = methods[event.name]
    if (this.getCounters().length > 0) {
      if (method && !this.getOption('noConflict')) {
        this[method](event)
      }
      this.trackCustomEvent(event)
    }
  }

  onViewedPage (event) {
    this.pageTracked = false
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'pageView',
        start: Date.now()
      })
    })

    const page = event.page || {}
    if (page.type === 'home') {
      this.onViewedHome(event)
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOtherPage(event)
        }
      }, 100)
    }
  }

  onViewedHome (event) {
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: '',
        pagetype: 'home',
        totalvalue: '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onViewedProductCategory (event) {
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: '',
        pagetype: 'category',
        totalvalue: '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onViewedProductDetail (event) {
    const { product } = event
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: ((counter.feedWithGroupedProducts !== true) ? product.id : product.skuCode) || '',
        pagetype: 'product',
        totalvalue: product.unitSalePrice || '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onAddedProduct (event) {
    const { product, quantity } = event
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: (counter.feedWithGroupedProducts !== true ? product.id : product.skuCode) || '',
        pagetype: 'cart',
        totalvalue: ((product.unitSalePrice || product.unitPrice) * quantity) || '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onViewedCart (event) {
    const { cart } = event
    this.getCounters().forEach((counter) => {
      let productIds

      if (cart.lineItems && cart.lineItems.length > 0) {
        productIds = lineItemsToProductIds(cart.lineItems, counter.feedWithGroupedProducts)
      }

      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: productIds || '',
        pagetype: 'cart',
        totalvalue: cart.total || '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onViewedOtherPage (event) {
    this.getCounters().forEach((counter) => {
      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: '',
        pagetype: 'other',
        totalvalue: '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  onCompletedTransaction (event) {
    const { transaction } = event

    this.getCounters().forEach((counter) => {
      let productIds

      if (transaction.lineItems && transaction.lineItems.length > 0) {
        productIds = lineItemsToProductIds(transaction.lineItems, counter.feedWithGroupedProducts)
      }

      window._tmr.push({
        id: counter.counterId,
        type: 'itemView',
        productid: productIds || '',
        pagetype: 'purchase',
        totalvalue: transaction.total || transaction.subtotal || '',
        list: this.getList(event, counter)
      })
    })
    this.pageTracked = true
  }

  trackCustomEvent (event) {
    const goals = this.getOption('goals')
    const goalIdentificator = goals[event.name]
    if (goalIdentificator) {
      this.getCounters().forEach((counter) => {
        window._tmr.push(cleanObject({
          id: counter.counterId,
          type: 'reachGoal',
          goal: goalIdentificator,
          value: event.value ? Math.round(event.value) : undefined
        }))
      })
    }
  }
}

export default MyTarget
