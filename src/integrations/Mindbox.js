import Integration from './../Integration.js';

class Mindbox extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectSystemName: '',
      brandSystemName: '',
      pointOfContactSystemName: '',
      projectDomain: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    const src = '//tracker.directcrm.ru/scripts/v1/tracker.js?v=' + Math.random();
    this.addTag({
      type: 'script',
      attr: {
        async: 1,
        src: src,
      },
    });

    this._isLoaded = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }
}

export default Mindbox;
