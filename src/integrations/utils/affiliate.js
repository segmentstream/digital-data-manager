import cookie from 'js-cookie'
import normalizeString from '@segmentstream/utils/normalizeString'
import topDomain from '@segmentstream/utils/topDomain'

export function isDeduplication (campaign = {}, utmSource = '', deduplicationUtmMedium = []) {
  const campaignSource = campaign.source || ''
  if (!campaignSource || campaignSource.toLowerCase() !== utmSource.toLowerCase()) {
    // last click source is not partner
    if (!deduplicationUtmMedium || deduplicationUtmMedium.length === 0) {
      // deduplicate with everything
      return true
    }
    const campaignMedium = (campaign.medium || '').toLowerCase()
    deduplicationUtmMedium = deduplicationUtmMedium.map(normalizeString)
    if (deduplicationUtmMedium.indexOf(campaignMedium) >= 0) {
      // last click medium is deduplicated
      return true
    }
  }
  return false
}

export function addAffiliateCookie (cookieName, cookieValue, expires = 90, domain) {
  if (window.self !== window.top) {
    return // protect from iframe cookie-stuffing
  }
  if (!domain) {
    domain = topDomain(window.location.href)
  }
  cookie.set(cookieName, cookieValue, { expires, domain })
}

export function removeAffiliateCookie (cookieName, domain) {
  if (!domain) {
    domain = topDomain(window.location.href)
  }
  cookie.remove(cookieName, { domain })
}

export function getAffiliateCookie (cookieName) {
  return cookie.get(cookieName)
}

export function normalizeOptions (options) {
  if (options.deduplication) {
    if (options.utmSource) {
      options.utmSource = normalizeString(options.utmSource)
    }
    if (options.deduplicationUtmMedium) {
      options.deduplicationUtmMedium = options.deduplicationUtmMedium.map(normalizeString)
    }
  }
}
