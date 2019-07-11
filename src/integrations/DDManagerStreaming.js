import sha256 from 'crypto-js/sha256'
import utmParams from '@segmentstream/utils/utmParams'
import getQueryParam from '@segmentstream/utils/getQueryParam'
import htmlGlobals from '@segmentstream/utils/htmlGlobals'
import cleanObject from '@segmentstream/utils/cleanObject'
import arrayMerge from '@segmentstream/utils/arrayMerge'
import size from '@segmentstream/utils/size'
import isCrawler from '@segmentstream/utils/isCrawler'
import each from '@segmentstream/utils/each'
import { warn } from '@segmentstream/utils/safeConsole'
import utmParamsFromReferrer from '@segmentstream/utils/utmParamsFromReferrer'
import uuid from 'uuid/v1'
import UAParser from 'ua-parser-js'
import Integration from '../Integration'
import StreamingFilters, {
  pageProps,
  listingProps,
  cartProps,
  productProps,
  transactionProps,
  campaignProps,
  listItemProps,
  websiteProps
} from './DDManagerStreaming/Filters'
import {
  DIGITALDATA_VAR,
  PRODUCT_VAR
} from '../variableTypes'
import {
  VIEWED_PAGE,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  VIEWED_EXPERIMENT,
  INTEGRATION_VALIDATION_FAILED,
  EXCEPTION
} from '../events/semanticEvents'

class DDManagerStreaming extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectId: '',
      projectName: '',
      buildNumber: 1,
      trackingUrl: 'https://track.ddmanager.ru/collect',
      dimensions: {},
      metrics: {},
      internal: false,
      streamingEndpoint: '',
      streamingEndpoints: []
    }, options)
    super(digitalData, optionsWithDefaults)
    this.website = {}

    this.dimensions = {}
    this.metrics = {}
    this.productDimensions = {}
    this.productMetrics = {}
    this.customEnrichableProps = []

    this.viewedPageCounter = 0

    // TODO: refactoring
    each(optionsWithDefaults.dimensions, (key, variable) => {
      if (variable.type === PRODUCT_VAR) {
        this.productDimensions[key] = variable.value
      } else {
        if (variable.type === DIGITALDATA_VAR) {
          this.customEnrichableProps.push(variable.value)
        }
        this.dimensions[key] = variable.value
      }
    })
    each(optionsWithDefaults.metrics, (key, variable) => {
      if (variable.type === PRODUCT_VAR) {
        this.productMetrics[key] = variable.value
      } else {
        if (variable.type === DIGITALDATA_VAR) {
          this.customEnrichableProps.push(variable.value)
        }
        this.metrics[key] = variable.value
      }
    })
    this.filters = new StreamingFilters(
      this.dimensions,
      this.metrics,
      this.productDimensions,
      this.productMetrics
    )

    this.setupStreamingEndpoints()
  }

  setupStreamingEndpoints () {
    const streamingEndpoints = this.getOption('streamingEndpoints') || []

    // TODO: remove (backward compatibility)
    const streamingEndpoint = this.getOption('streamingEndpoint')
    if (streamingEndpoint) streamingEndpoints.push(streamingEndpoint)

    const trackingUrl = this.getOption('trackingUrl')
    if (trackingUrl) streamingEndpoints.unshift(trackingUrl) // the main tracking url should be the first

    this.streamingEndpoints = streamingEndpoints.filter(endpoint => endpoint.match(/^(https?):\/\/[^ "]+$/))
  }

  initialize () {
    this._isLoaded = true
    if (isCrawler(htmlGlobals.getNavigator().userAgent)) {
      return false
    }
    return true
  }

  getIgnoredEvents () {
    if (this.getOption('internal')) {
      return [VIEWED_PRODUCT, CLICKED_PRODUCT, INTEGRATION_VALIDATION_FAILED, EXCEPTION]
    }
    return []
  }

  getEnrichableEventProps (event) {
    const mapping = {
      [VIEWED_PAGE]: ['page', 'user.userId', 'user.anonymousId', 'user.email', 'website'],
      [VIEWED_CART]: ['cart'],
      [COMPLETED_TRANSACTION]: ['transaction'],
      [VIEWED_PRODUCT_DETAIL]: ['product'],
      [VIEWED_PRODUCT_LISTING]: ['listing'],
      [SEARCHED_PRODUCTS]: ['listing']
    }

    const enrichableProps = mapping[event.name] || []
    arrayMerge(
      enrichableProps,
      this.customEnrichableProps
    )
    return enrichableProps
  }

  getValidationFields (...keys) {
    const fieldsMapping = {
      website: websiteProps,
      page: pageProps,
      cart: [...cartProps, 'vouchers'],
      listing: listingProps,
      transaction: [...transactionProps, 'vouchers'],
      product: productProps,
      campaign: campaignProps,
      listItem: listItemProps,
      experiment: ['id', 'name', 'variationId', 'variationName']
    }

    const validationFields = (Array.isArray(keys)) ? keys.reduce((result, key) => {
      fieldsMapping[key].forEach((prop) => {
        result.push([key, prop].join('.'))
        if (key === 'campaign') {
          result.push(['campaigns[]', prop].join('.'))
        } else if (key === 'listItem') {
          result.push(['listItems[]', prop].join('.'))
        }
      })
      return result
    }, []) : []

    arrayMerge(validationFields, this.customEnrichableProps)
    arrayMerge(validationFields, ['category', 'label'])

    return validationFields
  }

  getEventValidationConfig (event) {
    const productFields = () => this.getValidationFields('product')
    const mapping = {
      [VIEWED_PAGE]: {
        fields: this.getValidationFields('page', 'website')
      },
      [VIEWED_CART]: {
        fields: this.getValidationFields('cart')
      },
      [COMPLETED_TRANSACTION]: {
        fields: this.getValidationFields('transaction')
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: productFields
      },
      [ADDED_PRODUCT]: {
        fields: productFields
      },
      [REMOVED_PRODUCT]: {
        fields: productFields
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: this.getValidationFields('listing')
      },
      [SEARCHED_PRODUCTS]: {
        fields: this.getValidationFields('listing')
      },
      [VIEWED_CAMPAIGN]: {
        fields: this.getValidationFields('campaign')
      },
      [CLICKED_CAMPAIGN]: {
        fields: this.getValidationFields('campaign')
      },
      [VIEWED_PRODUCT]: {
        fields: this.getValidationFields('listItem')
      },
      [CLICKED_PRODUCT]: {
        fields: this.getValidationFields('listItem')
      },
      [VIEWED_EXPERIMENT]: {
        fields: this.getValidationFields('experiment')
      }
    }

    const validationConfig = mapping[event.name] || {}
    if (typeof validationConfig.fields === 'function') {
      validationConfig.fields = validationConfig.fields()
    } else {
      validationConfig.fields = validationConfig.fields || this.getValidationFields()
    }

    return validationConfig
  }

  allowCustomEvents () {
    return true
  }

  getCampaign (referrer, search) {
    let campaign = utmParams(search)
    const gclid = getQueryParam('gclid')
    const yclid = getQueryParam('yclid')
    const ymclid = getQueryParam('ymclid')

    if (!size(campaign)) {
      if (gclid) campaign.source = 'google'
      if (yclid) campaign.source = 'yandex'
      if (ymclid) campaign.source = 'yandex_market'
      if (gclid || yclid || ymclid) campaign.medium = 'cpc'
    }

    if (!size(campaign)) {
      campaign = utmParamsFromReferrer(referrer)
    }
    return campaign
  }

  normalize (hitData) {
    const hitId = uuid()
    let { referrer } = (this.viewedPageCounter < 2) ? htmlGlobals.getDocument() : {}
    const location = htmlGlobals.getLocation()
    let {
      search,
      href: url,
      hash,
      pathname: path
    } = location

    const campaign = this.getCampaign(referrer, search)

    try { path = (path) ? decodeURIComponent(path) : undefined } catch (e) { warn(e) }
    try { referrer = (referrer) ? decodeURI(referrer) : undefined } catch (e) { warn(e) }
    try { search = (search) ? decodeURIComponent(search) : undefined } catch (e) { warn(e) }
    try { url = (url) ? decodeURI(url) : undefined } catch (e) { warn(e) }
    try { hash = (hash) ? decodeURIComponent(hash) : undefined } catch (e) { warn(e) }

    const { title } = htmlGlobals.getDocument()

    const uaParser = new UAParser()
    const browser = uaParser.getBrowser()
    const device = { type: 'desktop', ...cleanObject(uaParser.getDevice()) }

    const commonFields = cleanObject({
      hitId,
      projectId: this.getOption('projectId'),
      projectName: this.getOption('projectName'),
      anonymousId: this.getAnonymousId(),
      userId: this.getUserId(),
      emailHash: this.getEmailHash(),
      context: {
        campaign: size(campaign) ? campaign : undefined,
        library: this.library,
        page: {
          path, referrer, search, title, url, hash
        },
        userAgent: htmlGlobals.getNavigator().userAgent,
        browser,
        device,
        screenWidth: window.screen ? window.screen.width : undefined,
        screenHeight: window.screen ? window.screen.height : undefined
      },
      sentAt: (new Date()).toISOString(),
      version: this.getOption('buildNumber')
    })

    return Object.assign(hitData, commonFields)
  }

  setAnonymousId (anonymousId) {
    this.anonymousId = anonymousId
  }

  getAnonymousId () {
    return this.anonymousId
  }

  getUserId () {
    return this.userId
  }

  setUserId (userId) {
    this.userId = userId
  }

  getEmailHash () {
    return this.emailHash
  }

  setEmailHash (emailHash) {
    this.emailHash = emailHash
  }

  trackEvent (event) {
    // identify
    if (size(event.user)) {
      const user = event.user || {}
      if (user.email) {
        this.setEmailHash(sha256(user.email.trim()).toString())
      }
      if (user.anonymousId) {
        this.setAnonymousId(user.anonymousId)
      }
      if (user.userId) {
        this.setUserId(String(user.userId))
      }
    }

    if (event.name === VIEWED_PAGE && event.website) {
      this.website = this.filters.filterWebsite(event.website)
    }
    // for SPA apps we create campaign only on first pageview
    if (event.name === VIEWED_PAGE) this.viewedPageCounter += 1

    this.sendEventHit(event)
  }

  sendEventHit (event) {
    const hitData = this.normalize({
      event: this.filters.filterEventHit(event),
      website: this.website,
      type: 'event'
    })
    this.send(hitData)
  }

  getCacheKey () {
    return ['ddm', 'stream', this.projectId].join(':')
  }

  send (hitData) {
    /*
      try {
      const streamCache = window.localStorage.getItem(this.getCacheKey());
      window.localStorage.setItem(this.getCacheKey(hitId), JSON.stringify(hitData));
      } catch (e) {
      // localstorage not supported
      // TODO: save to memory
      } */
    this.streamingEndpoints.forEach((endpoint) => {
      window.fetch(endpoint, {
        method: 'post',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(hitData)
      }).then((response) => {
        if (response.ok) {
          // window.localStorage.removeItem(this.getCacheKey(hitData.hitId));
        }
      }).catch((e) => {
        warn(e)
      })
    })
  }
}

export default DDManagerStreaming
