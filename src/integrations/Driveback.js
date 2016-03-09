import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import noop from './../functions/noop.js';

class Driveback extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      autoInit: true,
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
      window.Driveback.initStubCalled = false;
      window.Driveback.init = () => {
        window.Driveback.initStubCalled = true;
      };
      window.DrivebackLoaderAsyncInit = () => {
        window.Driveback.Loader.init(this.getOption('websiteToken'));
      };
      // by default Driveback is initialized automatically
      if (this.getOption('autoInit') === false) {
        window.DriveBackAsyncInit = noop;
      }
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
