import deleteProperty from '@segmentstream/utils/deleteProperty'
import { getProp } from '@segmentstream/utils/dotProp'
import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION
} from '../events/semanticEvents'

class Flocktory extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      preCheckout: false,
      postCheckout: true,
      exchange: false,
      exchangeTriggerEvent: 'Completed Transaction'
    }, options)

    super(digitalData, optionsWithDefaults)

    this.SEMANTIC_EVENTS = []

    this.pageTracked = false

    this.addTag({
      type: 'script',
      attr: {
        src: `https://api.flocktory.com/v2/loader.js?site_id=${options.siteId}`
      }
    })
  }

  initialize () {
    window.flocktory = window.flocktory || []
  }

  allowCustomEvents () {
    return true
  }

  getSemanticEvents () {
    const exchangeTriggerEvent = this.getOption('exchangeTriggerEvent')
    if (this.getOption('preCheckout')) {
      this.SEMANTIC_EVENTS.push(...[
        VIEWED_PAGE,
        VIEWED_PRODUCT_DETAIL,
        VIEWED_PRODUCT_LISTING,
        ADDED_PRODUCT,
        REMOVED_PRODUCT,
        COMPLETED_TRANSACTION
      ])
    } else if (this.getOption('postCheckout')) {
      this.SEMANTIC_EVENTS.push(COMPLETED_TRANSACTION)
    }
    if (this.getOption('exchange') && this.SEMANTIC_EVENTS.indexOf(exchangeTriggerEvent) < 0) {
      this.SEMANTIC_EVENTS.push(exchangeTriggerEvent)
    }
    return this.SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    const exchangeTriggerEvent = this.getOption('exchangeTriggerEvent')
    const enrichableEventProps = []
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableEventProps.push(...[
          'user.email',
          'user.isLoggedIn',
          'user.firstName',
          'user.lastName',
          'user.fullName',
          'cart'
        ])
        break
      case VIEWED_PRODUCT_DETAIL:
        enrichableEventProps.push(...[
          'product'
        ])
        break
      case VIEWED_PRODUCT_LISTING:
        enrichableEventProps.push(...[
          'listing.categoryId'
        ])
        break
      case ADDED_PRODUCT:
        enrichableEventProps.push(...[
          'product'
        ])
        break
      case REMOVED_PRODUCT:
        enrichableEventProps.push(...[
          'product'
        ])
        break
      case COMPLETED_TRANSACTION:
        enrichableEventProps.push(...[
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.fullName',
          'transaction'
        ])
        break
      default:
        // do nothing
    }
    if (this.getOption('exchange') && event.name === exchangeTriggerEvent) {
      enrichableEventProps.push(...[
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.fullName'
      ])
    }
    return enrichableEventProps
  }

  isLoaded () {
    return (window.flocktory && window.flocktory.loaded)
  }

  reset () {
    deleteProperty(window, 'flocktory')
  }

  getUserName (event) {
    const fullName = getProp(event, 'user.fullName')
    if (fullName) return fullName

    const firstName = getProp(event, 'user.firstName')
    const lastName = getProp(event, 'user.lastName')

    if (firstName && lastName) {
      return [firstName, lastName].join(' ')
    }

    return firstName
  }

  getUserEmail (event) {
    const email = getProp(event, 'user.email')
    if (email) return email

    let phone = getProp(event, 'user.phone')
    if (phone) {
      phone = phone.replace(/\D/g, '')
    }
    if (phone) return `${phone}@unknown.email`

    const userId = getProp(event, 'user.userId')
    if (userId) return `${userId}@unknown.email`

    return undefined
  }

  trackEvent (event) {
    const eventMap = {
      [VIEWED_PAGE]: this.onViewedPage.bind(this),
      [ADDED_PRODUCT]: this.onAddedProduct.bind(this),
      [REMOVED_PRODUCT]: this.onRemovedProduct.bind(this),
      [VIEWED_PRODUCT_DETAIL]: this.onViewedProductDetail.bind(this),
      [VIEWED_PRODUCT_LISTING]: this.onViewedProductListing.bind(this),
      [COMPLETED_TRANSACTION]: this.onCompletedTransaction.bind(this)
    }

    if (this.getOption('exchange') && this.getOption('exchangeTriggerEvent') === event.name) {
      this.onExchangeTriggerEvent(event)
    }

    if (eventMap[event.name]) {
      eventMap[event.name](event)
    }
  }

  onViewedPage (event) {
    // Call flocktory reinitialization if page changed on SPA
    if (this.pageTracked) {
      window.flocktory.reInit()
    }

    this.pageTracked = true

    const isLoggedIn = getProp(event, 'user.isLoggedIn') || false
    if (isLoggedIn) {
      window.flocktory.push(['addData', {
        user: cleanObject({
          email: this.getUserEmail(event),
          name: this.getUserName(event)
        })
      }])
    }

    const { cart } = event
    if (cart && cart.lineItems && Array.isArray(cart.lineItems)) {
      window.flocktory.push(['updateCart', {
        cart: {
          items: cart.lineItems.map(lineItem => ({
            id: getProp(lineItem, 'product.id'),
            price: getProp(lineItem, 'product.unitSalePrice'),
            count: lineItem.quantity
          }))
        }
      }])
    }
  }

  onViewedProductListing (event) {
    window.flocktory.push(['trackCategoryView', {
      category: {
        id: String(getProp(event, 'listing.categoryId'))
      }
    }])
  }

  onViewedProductDetail (event) {
    window.flocktory.push(['trackItemView', {
      item: {
        id: String(getProp(event, 'product.id'))
      }
    }])
  }

  onAddedProduct (event) {
    window.flocktory.push(['addToCart', cleanObject({
      item: {
        id: String(getProp(event, 'product.id')),
        price: getProp(event, 'product.unitSalePrice'),
        count: getProp(event, 'quantity') || 1,
        brand: getProp(event, 'product.manufacturer'),
        categoryId: getProp(event, 'product.categoryId')
      }
    })])
  }

  onRemovedProduct (event) {
    window.flocktory.push(['removeFromCart', {
      item: {
        id: String(getProp(event, 'product.id')),
        count: getProp(event, 'quantity') || 1
      }
    }])
  }

  onCompletedTransaction (event) {
    if (this.getOption('postCheckout')) {
      const lineItems = getProp(event, 'transaction.lineItems') || []
      window.flocktory.push(['postcheckout', cleanObject({
        user: {
          name: this.getUserName(event),
          email: this.getUserEmail(event)
        },
        order: {
          id: String(getProp(event, 'transaction.orderId')),
          price: getProp(event, 'transaction.total'),
          items: lineItems.map(lineItem => cleanObject({
            id: String(getProp(lineItem, 'product.id')),
            title: getProp(lineItem, 'product.name'),
            price: getProp(lineItem, 'product.unitSalePrice'),
            image: getProp(lineItem, 'product.imageUrl'),
            count: getProp(lineItem, 'quantity')
          }))
        },
        spot: getProp(event, 'spot')
      })])
    }
  }

  onExchangeTriggerEvent (event) {
    window.flocktory.push(['exchange', cleanObject({
      user: {
        name: this.getUserName(event),
        email: this.getUserEmail(event)
      },
      spot: getProp(event, 'spot'),
      params: {}
    })])
  }
}

export default Flocktory
