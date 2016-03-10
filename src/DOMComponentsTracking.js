import each from './functions/each.js';

/**
 * Automatically tracks DOM components with proper data-attributes
 *
 * - data-ddl-viewed-product="<product_id>"
 * - data-ddl-viewed-campaign="<campaign_id>"
 * - data-ddl-clicked-product="<product_id>"
 * - data-ddl-clicked-campaign="<campaign_id>"
 */
class DOMComponentsTracking
{
  constructor(options) {
    this.options = Object.assign({
      websiteMaxWidth: undefined,
    }, options);

    this.viewedComponentIds = {
      product: [],
      campaign: [],
    };

    this.$digitalDataComponents = {
      product: {
        view: undefined,
        click: undefined,
      },
      campaign: {
        view: undefined,
        click: undefined,
      },
    };
  }

  initialize() {
    if (!window.jQuery) {
      return;
    }
    // detect max website width
    if (!this.options.websiteMaxWidth) {
      const $body = window.jQuery('body');
      this.options.websiteMaxWidth =
          $body.children('.container').first().width() ||
          $body.children('div').first().width();
    }

    // add DDL listeners for dynamic ajax websites
    window.ddListener.push(['on', 'change:listing', () => {
      this.removeClickHandlers(['product']);
      this.defineDigitalDataDomComponents(['product']);
      this.addClickHandlers(['product']);
    }]);
    window.ddListener.push(['on', 'change:recommendation', () => {
      this.removeClickHandlers(['product']);
      this.defineDigitalDataDomComponents(['product']);
      this.addClickHandlers(['product']);
    }]);
    window.ddListener.push(['on', 'change:campaigns', () => {
      this.defineDigitalDataDomComponents(['campaign']);
    }]);

    this.defineDocBoundaries();
    this.defineDigitalDataDomComponents();
    this.startViewsTracking();
    this.addClickHandlers();
  }

  defineDocBoundaries() {
    const $window = window.jQuery(window);

    const _defineDocBoundaries = () => {
      this.docViewTop = $window.scrollTop();
      this.docViewBottom = this.docViewTop + $window.height();
      this.docViewLeft = 0;
      this.docViewRight = $window.width();

      const maxWebsiteWidth = this.options.maxWebsiteWidth;
      if (maxWebsiteWidth && maxWebsiteWidth < this.docViewRight) {
        this.docViewLeft = (this.docViewRight - maxWebsiteWidth) / 2;
        this.docViewRight = this.docViewLeft + maxWebsiteWidth;
      }
    };

    _defineDocBoundaries();
    $window.resize(() => {
      _defineDocBoundaries();
    });
    $window.scroll(() => {
      _defineDocBoundaries();
    });
  }

  defineDigitalDataDomComponents(types) {
    if (!types) {
      types = ['product', 'campaign'];
    }
    for (const type of types) {
      const viewedSelector = 'ddl-viewed-' + type;
      const clickedSelector = 'ddl-clicked-' + type;
      this.$digitalDataComponents[type].view = this.findByDataAttr(viewedSelector);
      this.$digitalDataComponents[type].click = this.findByDataAttr(clickedSelector);
    }
  }

  addClickHandlers(types) {
    if (!types) {
      types = ['product', 'campaign'];
    }

    const onClick = (type) => {
      const self = this;
      return function onClickHandler() {
        const $el = window.jQuery(this);
        const id = $el.data('ddl-clicked-' + type);
        if (type === 'product') {
          self.fireClickedProduct(id);
        } else if (type === 'campaign') {
          self.fireClickedCampaign(id);
        }
      };
    };

    for (const type of types) {
      const eventName = 'click.ddl-clicked-' + type;
      this.$digitalDataComponents[type].click.bind(eventName, onClick(type));
    }
  }

  removeClickHandlers(types) {
    if (!types) {
      types = ['product', 'campaign'];
    }
    for (const type of types) {
      const eventName = 'click.ddl-clicked-' + type;
      this.$digitalDataComponents[type].click.unbind(eventName);
    }
  }

  startViewsTracking() {
    const _trackViews = () => {
      each(this.$digitalDataComponents, (type, $components) => {
        const newViewedComponentIds = [];

        $components.view.each((index, el) => {
          const $el = window.jQuery(el);
          const id = $el.data('ddl-viewed-' + type);
          if (this.viewedComponentIds[type].indexOf(id) < 0 && this.isVisible($el)) {
            this.viewedComponentIds[type].push(id);
            newViewedComponentIds.push(id);
          }
        });

        if (newViewedComponentIds.length > 0) {
          if (type === 'product') {
            this.fireViewedProduct(newViewedComponentIds);
          } else if (type === 'campaign') {
            this.fireViewedCampaign(newViewedComponentIds);
          }
        }
      });
    };

    _trackViews();
    setInterval(() => {
      _trackViews();
    }, 250);
  }

  fireViewedProduct(productIds) {
    window.digitalData.events.push({
      name: 'Viewed Product',
      category: 'Ecommerce',
      product: productIds,
    });
  }

  fireViewedCampaign(campaignIds) {
    window.digitalData.events.push({
      name: 'Viewed Campaign',
      category: 'Promo',
      campaign: campaignIds,
    });
  }

  fireClickedProduct(productId) {
    window.digitalData.events.push({
      name: 'Clicked Product',
      category: 'Ecommerce',
      product: productId,
    });
  }

  fireClickedCampaign(campaignId) {
    window.digitalData.events.push({
      name: 'Clicked Campaign',
      category: 'Promo',
      campaign: campaignId,
    });
  }

  /**
   * Returns true if element is visible by css
   * and at least 3/4 of the element fit user viewport
   *
   * @param $elem JQuery object
   * @returns boolean
   */
  isVisible($elem) {
    const elemWidth = $elem.width();
    const elemHeight = $elem.height();
    const elemOffset = $elem.offset();
    const elemTop = elemOffset.top;
    const elemBottom = elemTop + elemHeight;
    const elemLeft = elemOffset.left;
    const elemRight = elemLeft + elemWidth;

    const fitsVertical = (
      ((elemBottom - elemHeight / 4) <= this.docViewBottom) &&
      ((elemTop + elemHeight / 4) >= this.docViewTop)
    );
    const fitsHorizontal = (
      (elemLeft + elemWidth / 4 >= this.docViewLeft) &&
      (elemRight - elemWidth / 4 <= this.docViewRight)
    );

    return $elem.is(':visible') && fitsVertical && fitsHorizontal;
  }

  findByDataAttr(name, obj) {
    if (!obj) obj = window.jQuery(document.body);
    return obj.find('[data-' + name + ']');
  }
}

export default DOMComponentsTracking;
