import cookie from 'js-cookie';
import normalizeString from './../../functions/normalizeString';
import topDomain from './../../functions/topDomain';

export function isDeduplication(campaign = {}, utmSource = '', deduplicationUtmMedium = []) {
  const campaignSource = campaign.source || '';
  if (!campaignSource || campaignSource.toLowerCase() !== utmSource.toLowerCase()) {
    // last click source is not mixMarketCookie
    if (!deduplicationUtmMedium || deduplicationUtmMedium.length === 0) {
      // deduplicate with everything
      return true;
    }
    const campaignMedium = (campaign.medium || '').toLowerCase();
    deduplicationUtmMedium = deduplicationUtmMedium.map(normalizeString);
    if (deduplicationUtmMedium.indexOf(campaignMedium) >= 0) {
      // last click medium is deduplicated
      return true;
    }
  }
  return false;
}

export function addAffiliateCookie(cookieName, cookieValue, expires = 90, domain) {
  if (window.self !== window.top) {
    return; // protect from iframe cookie-stuffing
  }
  if (!domain) {
    domain = topDomain(window.location.href);
  }
  cookie.set(cookieName, cookieValue, { expires, domain });
}

export function getAffiliateCookie(cookieName) {
  return cookie.get(cookieName);
}
