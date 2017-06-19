import Integration from './../Integration';
import { getProp, setProp } from './../functions/dotProp';
import { VIEWED_PAGE } from './../events/semanticEvents';
import cookie from 'js-cookie';
import topDomain from './../functions/topDomain';

const TAG_COOKIE_SYNC = 'cookieSync';
const TAG_SUPER_SYNC = 'superSync';
const COOKIE_DOMAIN = topDomain(window.location);
const COOKIE_SYNC_NAME = '_1dmc_s';
const COOKIE_SYNC_TTL = 90;
const COOKIE_ENRICHMENT_NAME = '_1dmc_e';
const PROFILE_ENRICHMENT_FOUND_TTL = 7;
const PROFILE_ENRICHMENT_NOT_FOUND_TTL = 1;

class OneDMC extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      clientId: '',
      brandId: '',
      anonymousIdVar: '',
      superSync: false,
      profileEnrichment: false,
      token: '',
      attributesMapping: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag(TAG_COOKIE_SYNC, {
      type: 'img',
      attr: {
        src: `https://sync.1dmp.io/pixel.gif?cid=${options.clientId}&brid=${options.brandId}&pid=w&uid={{ anonymousId }}`,
      },
    });

    this.addTag(TAG_SUPER_SYNC, {
      type: 'iframe',
      attr: {
        src: `//sync.1dmp.io/supersync?cid=${options.clientId}&brid=${options.brandId}&pid=w&uid={{ anonymousId }}`,
      },
    });
  }

  getSemanticEvents() {
    return [VIEWED_PAGE];
  }

  getEnrichableEventProps(event) {
    if (event.name === VIEWED_PAGE) {
      const anonymousIdVar = this.getOption('anonymousIdVar');
      if (anonymousIdVar) {
        return [anonymousIdVar];
      }
    }
    return [];
  }

  getEventValidationConfig(event) {
    if (event.name === VIEWED_PAGE) {
      const anonymousIdVar = this.getOption('anonymousIdVar');
      if (anonymousIdVar) {
        return {
          fields: [anonymousIdVar],
          validations: {
            [anonymousIdVar]: {
              errors: ['required'],
            },
          },
        };
      }
    }
    return undefined;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();

    const token = this.getOption('token');
    const enrichmentCookie = cookie.get(COOKIE_ENRICHMENT_NAME);
    if (this.getOption('profileEnrichment') && token && !enrichmentCookie) {
      this.enrichDigitalData(token);
    }
  }

  getProfile(token, onComplete) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://profiles.1dmp.io/v1/profiles?token=${token}`, true);
    xhr.withCredentials = true;
    xhr.send();
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status === 200) {
        const profile = JSON.parse(xhr.responseText);
        if (profile && profile.attributes && Array.isArray(profile.attributes)) {
          onComplete(profile);
        }
        cookie.set(COOKIE_ENRICHMENT_NAME, 1, {
          expires: PROFILE_ENRICHMENT_FOUND_TTL,
          domain: COOKIE_DOMAIN,
        });
      } else {
        cookie.set(COOKIE_ENRICHMENT_NAME, 1, {
          expires: PROFILE_ENRICHMENT_NOT_FOUND_TTL,
          domain: COOKIE_DOMAIN,
        });
      }
    };
  }

  enrichDigitalData(token) {
    this.getProfile(token, (profile) => {
      const ttlInSeconds = PROFILE_ENRICHMENT_FOUND_TTL * 24 * 60 * 60;
      const attributes = profile.attributes;
      const attributesMapping = this.getOption('attributesMapping');
      for (const attribute of attributes) {
        let key = attribute.primary;
        if (key) {
          let enrichableVar = attributesMapping[key];
          if (enrichableVar) {
            if (attribute.secondary) {
              enrichableVar = [enrichableVar, attribute.secondary].join('.');
            }
            setProp(this.digitalData, enrichableVar, attribute.value);
            this.ddManager.persist(enrichableVar, ttlInSeconds);
          }
          if (attribute.secondary) {
            key = [key, attribute.secondary].join('.');
            enrichableVar = attributesMapping[key];
            if (enrichableVar) {
              setProp(this.digitalData, enrichableVar, attribute.value);
              this.ddManager.persist(enrichableVar, ttlInSeconds);
            }
          }
        }
      }
    });
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage(event);
    }
  }

  onViewedPage(event) {
    const syncCookie = cookie.get(COOKIE_SYNC_NAME);
    if (syncCookie) return;

    const anonymousIdVar = this.getOption('anonymousIdVar');
    if (!anonymousIdVar) return;

    const anonymousId = getProp(event, anonymousIdVar);
    if (!anonymousId) return;

    let tagName = TAG_COOKIE_SYNC;
    if (this.getOption('superSync')) {
      tagName = TAG_SUPER_SYNC;
    }

    this.load(tagName, { anonymousId }, () => {
      cookie.set(COOKIE_SYNC_NAME, 1, {
        expires: COOKIE_SYNC_TTL,
        domain: COOKIE_DOMAIN,
      });
    });
  }
}

export default OneDMC;
