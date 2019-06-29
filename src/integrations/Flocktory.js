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
      exchange: false
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

  getSemanticEvents () {
    if (this.getOption('preCheckout')) {
      this.SEMANTIC_EVENTS.push(...[
        VIEWED_PAGE,
        VIEWED_PRODUCT_DETAIL,
        VIEWED_PRODUCT_LISTING,
        ADDED_PRODUCT,
        REMOVED_PRODUCT,
        COMPLETED_TRANSACTION
      ])
    } else if (this.getOption('postCheckout') || this.getOption('exchange')) {
      this.SEMANTIC_EVENTS.push(COMPLETED_TRANSACTION)
    }
    return this.SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    switch (event.name) {
      case VIEWED_PAGE:
        return [
          'user.email',
          'user.isLoggedIn',
          'user.firstName',
          'user.lastName',
          'user.fullName',
          'cart'
        ]
      case VIEWED_PRODUCT_DETAIL:
        return [
          'product'
        ]
      case VIEWED_PRODUCT_LISTING:
        return [
          'listing.categoryId'
        ]
      case ADDED_PRODUCT:
        return [
          'product'
        ]
      case REMOVED_PRODUCT:
        return [
          'product'
        ]
      case COMPLETED_TRANSACTION:
        return [
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.fullName',
          'transaction'
        ]
      default:
        return []
    }
  }

  getEventValidationConfig (event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: [
          'user.isLoggedIn',
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.fullName'
        ]
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
      [ADDED_PRODUCT]: {
        fields: ['product.id', 'product.unitSalePrice', 'quantity'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string']
          },
          'product.unitSalePrice': {
            errors: ['required'],
            warnings: ['numeric']
          },
          quantity: {
            errors: ['required'],
            warnings: ['numeric']
          }
        }
      },
      [REMOVED_PRODUCT]: {
        fields: ['product.id', 'quantity'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string']
          },
          quantity: {
            errors: ['required'],
            warnings: ['numeric']
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
      [COMPLETED_TRANSACTION]: {
        fields: [
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.fullName',
          'transaction.orderId',
          'transaction.total',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].product.imageUrl',
          'transaction.lineItems[].quantity',
          'integrations.flocktory.spot'
        ],
        validations: {
          'user.email': {
            warnings: ['required', 'string']
          },
          'user.firstName': {
            errors: ['string']
          },
          'user.lastName': {
            errors: ['string']
          },
          'user.fullName': {
            errors: ['string']
          },
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string']
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric']
          },
          'transaction.lineItems[].product.id': {
            warnings: ['string']
          },
          'transaction.lineItems[].product.name': {
            warnings: ['string']
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['numeric']
          },
          'transaction.lineItems[].product.imageUrl': {
            warnings: ['string']
          },
          'transaction.lineItems[].quantity': {
            warnings: ['numeric']
          }
        }
      }
    }

    return config[event.name]
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
        spot: getProp(event, 'spot') || getProp(event, 'integrations.flocktory.spot')
      })])
    }

    if (this.getOption('exchange')) {
      window.flocktory.push(['exchange', cleanObject({
        user: {
          name: this.getUserName(event),
          email: this.getUserEmail(event)
        }
      })])
    }
  }
}

export default Flocktory
