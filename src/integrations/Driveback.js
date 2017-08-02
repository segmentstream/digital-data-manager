import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import noop from './../functions/noop.js';
import {
  VIEWED_PAGE,
  VIEWED_EXPERIMENT,
  ACHIEVED_EXPERIMENT_GOAL,
} from './../events/semanticEvents';

function getExperment(experiment) {
  if (typeof experiment === 'object') {
    if (experiment.id) {
      return experiment;
    }
    return undefined;
  }
  if (experiment) {
    return {
      id: experiment,
    };
  }
  return undefined;
}

class Driveback extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      websiteToken: '',
      experiments: false,
      experimentsToken: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_EXPERIMENT,
      ACHIEVED_EXPERIMENT_GOAL,
    ];

    this.addTag({
      type: 'script',
      attr: {
        id: 'driveback-sdk',
        src: '//cdn.driveback.ru/js/loader.js',
      },
    });
  }

  getEventValidationConfig(event) {
    let fields;
    let validations;

    if (typeof event.experiment === 'string') {
      fields = ['experiment'];
      validations = {
        'experiment': {
          errors: ['required', 'string'],
        },
      };
    } else {
      fields = ['experiment.id', 'experiment.variationId'];
      validations = {
        'experiment.id': {
          errors: ['required', 'string'],
        },
        'experiment.variationId': {
          errors: ['numeric'],
        },
      };
    }

    const config = {
      [VIEWED_EXPERIMENT]: {
        fields: fields,
        validations: validations,
      },
      [ACHIEVED_EXPERIMENT_GOAL]: {
        fields: fields,
        validations: validations,
      },
    };

    return config[event.name];
  }

  initialize() {
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
    window.DrivebackAsyncInit = noop;

    // init Driveback Experiments
    if (this.getOption('experiments') && this.getOption('experimentsToken')) {
      window.DrivebackOnLoad.push(() => {
        window.dbex('init', this.getOption('experimentsToken'));
      });
    }

    if (this.getOption('experiments')) {
      this.enrichDigitalData();
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  enrichDigitalData() {
    window.ddListener.push(['on', 'beforeEvent', (event) => {
      if (event.name === VIEWED_PAGE) {
        window.DrivebackOnLoad.push(() => {
          window.dbex(() => {
            window.digitalData.changes.push(['user.experiments', window.dbex.chooseVariations(), 'DDM Driveback Integration']);
            this.onEnrich();
          });
        });
      }
    }]);
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (this.getOption('experiments')) {
      if (event.name === VIEWED_EXPERIMENT) {
        const experiment = getExperment(event.experiment);
        if (!experiment) {
          return;
        }
        if (experiment.variationId !== undefined) {
          window.DrivebackOnLoad.push(() => {
            window.dbex('setVariation', experiment.id, experiment.variationId);
          });
        }
        window.DrivebackOnLoad.push(() => {
          window.dbex('trackSession', experiment.id);
        });
      } else if (event.name === ACHIEVED_EXPERIMENT_GOAL) {
        const experiment = getExperment(event.experiment);
        if (!experiment) {
          return;
        }

        window.DrivebackOnLoad.push(() => {
          window.dbex('trackConversion', experiment.id, event.value);
        });
      }
    }
  }

  onViewedPage() {
    if (window.Driveback.initInvoked) {
      window.DriveBack.reactivateCampaigns(); // keep capital "B" in DriveBack
    } else {
      if (this.getOption('experiments')) {
        window.DrivebackOnLoad.push(() => {
          window.dbex(function onDbexExperimentsLoaded() {
            window.Driveback.init();
          });
        });
      } else {
        window.Driveback.init();
      }
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
    deleteProperty(window, 'dbex');
  }
}

export default Driveback;
