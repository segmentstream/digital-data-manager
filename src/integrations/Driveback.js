import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import noop from 'driveback-utils/noop';
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
        experiment: {
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
        fields,
        validations,
      },
      [ACHIEVED_EXPERIMENT_GOAL]: {
        fields,
        validations,
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
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (event.name === VIEWED_EXPERIMENT) {
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

  onViewedPage() {
    if (window.Driveback.initInvoked) {
      if (window.DriveBack.newPage) {
        window.DriveBack.newPage(); // keep capital "B" in DriveBack
      } else {
        window.DriveBack.reactivateCampaigns(); // remove later
      }
    } else {
      window.Driveback.init();
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
