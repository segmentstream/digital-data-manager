import noop from './functions/noop.js';

class ViewabilityTracker
{
  constructor(options) {
    this.options = Object.assign({
      websiteMaxWidth: 'auto',
    }, options);

    this.$trackedComponents = {};
    this.viewedComponents = {};
    this.selectorHandlers = {};
    this.selectors = [];
  }

  addTracker(selector, handler) {
    // start tracking only when at least one
    // tracker is added
    if (this.selectors.length === 0) {
      this.startTracking();
    }

    if (this.selectors.indexOf(selector) < 0) {
      this.selectors.push(selector);
    }

    const selectorHandlers = this.selectorHandlers[selector];
    if (!selectorHandlers) {
      this.selectorHandlers[selector] = [handler];
    } else {
      selectorHandlers.push(handler);
    }

    // prepare empty array for tacking already viewed components
    if (!this.viewedComponents[selector]) {
      this.viewedComponents[selector] = [];
    }
  }

  initialize() {
    if (!window.jQuery) {
      return;
    }
    window.jQuery(() => {
      // detect max website width
      if (!this.options.websiteMaxWidth || this.options.websiteMaxWidth === 'auto') {
        const $body = window.jQuery('body');
        this.options.websiteMaxWidth =
          $body.children('.container').first().width() ||
          $body.children('div').first().width();
      }
    });
  }

  defineDocBoundaries() {
    const $window = window.jQuery(window);

    const _defineDocBoundaries = () => {
      this.docViewTop = $window.scrollTop();
      this.docViewBottom = this.docViewTop + $window.height();
      this.docViewLeft = $window.scrollLeft();
      this.docViewRight = this.docViewLeft + $window.width();

      const maxWebsiteWidth = this.options.maxWebsiteWidth;
      if (maxWebsiteWidth && maxWebsiteWidth < this.docViewRight && this.docViewLeft === 0) {
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

  updateTrackedComponents() {
    for (const selector of this.selectors) {
      this.$trackedComponents[selector] = window.jQuery(selector);
    }
  }

  trackViews() {
    for (const selector of this.selectors) {
      const newViewedComponents = [];
      const $components = this.$trackedComponents[selector];
      $components.each((index, el) => { // eslint-disable-line no-loop-func
        const $el = window.jQuery(el);
        if (this.viewedComponents[selector].indexOf(el) < 0 && this.isVisible($el)) {
          this.viewedComponents[selector].push(el);
          newViewedComponents.push(el);
        }
      });

      if (newViewedComponents.length > 0) {
        const handlers = this.selectorHandlers[selector];
        for (const handler of handlers) {
          handler(newViewedComponents, noop);
        }
      }
    }
  }

  startTracking() {
    this.defineDocBoundaries();

    const _track = () => {
      this.updateTrackedComponents();
      this.trackViews();
    };

    _track();
    setInterval(() => {
      _track();
    }, 500);
  }

  /**
   * Returns true if element is visible by css
   * and at least 3/4 of the element fit user viewport
   *
   * @param $elem JQuery object
   * @returns boolean
   */
  isVisible($elem) {
    const el = $elem[0];
    const $window = window.jQuery(window);

    const elemOffset = $elem.offset();
    const elemWidth = $elem.width();
    const elemHeight = $elem.height();

    const elemTop = elemOffset.top;
    const elemBottom = elemTop + elemHeight;
    const elemLeft = elemOffset.left;
    const elemRight = elemLeft + elemWidth;

    const visible = $elem.is(':visible') && $elem.css('opacity') > 0 && $elem.css('visibility') !== 'hidden';
    if (!visible) {
      return false;
    }

    const fitsVertical = (
      ((elemBottom - elemHeight / 4) <= this.docViewBottom) &&
      ((elemTop + elemHeight / 4) >= this.docViewTop)
    );
    const fitsHorizontal = (
      (elemLeft + elemWidth / 4 >= this.docViewLeft) &&
      (elemRight - elemWidth / 4 <= this.docViewRight)
    );

    if (!fitsVertical || !fitsHorizontal) {
      return false;
    }

    let elementFromPoint = document.elementFromPoint(
        elemLeft - $window.scrollLeft() + elemWidth / 2,
        elemTop - $window.scrollTop() + elemHeight / 2
    );

    while (elementFromPoint && elementFromPoint !== el && elementFromPoint.parentNode !== document) {
      elementFromPoint = elementFromPoint.parentNode;
    }

    return (!!elementFromPoint && elementFromPoint === el);
  }
}

export default ViewabilityTracker;
