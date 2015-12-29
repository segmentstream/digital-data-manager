import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

class Driveback extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      websiteToken: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'driveback-sdk',
        src: '//cdn.driveback.ru/js/loader.js',
      },
    });
  }

  static getName() {
    return 'Driveback';
  }

  initialize() {
    if (this.getOption('websiteToken')) {
      window.DrivebackNamespace = 'Driveback';
      window.Driveback = window.Driveback || {};
      window.DrivebackOnLoad = window.DrivebackOnLoad || [];
      window.DrivebackLoaderAsyncInit = () => {
        window.Driveback.Loader.init(this.getOption('websiteToken'));
      };
      this.load(this.ready);
    } else {
      this.ready();
    }
  }

  isLoaded() {
    return !!(window.Driveback && window.Driveback.Loader);
  }

  reset() {
    deleteProperty(window, 'Driveback');
    deleteProperty(window, 'DriveBack');
    deleteProperty(window, 'DrivebackNamespace');
    deleteProperty(window, 'DrivebackOnLoad');
    deleteProperty(window, 'DrivebackLoaderAsyncInit');
    deleteProperty(window, 'DrivebackAsyncInit');
  }
}

export default Driveback;
