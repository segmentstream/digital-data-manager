var fs = require('fs');

module.exports = function(config) {
  var customLaunchers;
  var browsers;
  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_ENABLED = require('./sauce.json').enabled;
      process.env.SAUCE_USERNAME = require('./sauce.json').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce.json').accessKey;
    }
  } else {
    process.env.SAUCE_ENABLED = true;
  }

  if (process.env.SAUCE_ENABLED == "true") {
    customLaunchers = {
      slIe8Win7: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows XP',
        version: '8'
      },
      // slChromeWinXp: {
      //   base: 'SauceLabs',
      //   browserName: 'chrome',
      //   platform: 'Windows XP'
      // },
      // slIe10Win7: {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   platform: 'Windows 7',
      //   version: '10'
      // },
      // slIe9Win7: {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   platform: 'Windows 7',
      //   version: '9'
      // },
      // slIe11Win10: {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   platform: 'Windows 10',
      //   version: '11'
      // },
      // slME25Win10: {
      //   base: 'SauceLabs',
      //   browserName: 'microsoftedge',
      //   platform: 'Windows 10',
      //   version: '13'
      // },
      // slSafariOsx: {
      //   base: 'SauceLabs',
      //   browserName: 'safari',
      //   platform: 'OS X 10.8'
      // },
      // slSafariOsx11: {
      //   base: 'SauceLabs',
      //   browserName: 'safari',
      //   platform: 'OS X 10.11'
      // },
      // slOpera12Win7: {
      //   base: 'SauceLabs',
      //   browserName: 'opera',
      //   platform: 'Windows 7',
      //   version: '12.12'
      // },
      // slIphone: {
      //   base: 'SauceLabs',
      //   browserName: 'iphone',
      //   platform: 'OS X 10.10',
      //   version: '8.2',
      //   deviceName: 'iPhone Simulator'
      // },
      // slIpad: {
      //   base: 'SauceLabs',
      //   browserName: 'iphone',
      //   platform: 'OS X 10.10',
      //   version: '8.2',
      //   deviceName: 'iPad Simulator'
      // },
      // slAndroid: {
      //   base: 'SauceLabs',
      //   browserName: 'android',
      //   platform: 'Linux',
      //   version: '5.1',
      //   deviceName: 'Android Emulator'
      // }
    };
    browsers = Object.keys(customLaunchers);
  } else {
    customLaunchers = null;
    browsers = ["Safari"];
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [/*'browserify',*/'mocha'],

    client: {
      mocha: {
        timeout : 5000
      }
    },

    sauceLabs: {
      testName: 'Digital Data Manager Unit Tests',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      recordScreenshots: false,
      startConnect: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
      public: 'public'
    },

    // list of files / patterns to load in the browser
    files: [
      'build/dd-manager-test.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    //preprocessors: {
    //  'src/**/*.js': ['browserify'],
    //  'test/**/*.js': ['browserify']
    //},
    //
    //browserify: {
    //  debug: true,
    //  transform: ['babelify', ['polyify', { 'browsers': 'IE >= 7' }]],
    //  configure: function(bundle) {
    //    bundle.on('bundled', function(err, content) {
    //      console.log(content);
    //    });
    //  }
    //},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Increase timeout in case connection in CI is slow
    captureTimeout: 120000,
    customLaunchers: customLaunchers,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: browsers,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    // concurrency: 5,
    //
    // browserDisconnectTimeout: 10000,
    // browserDisconnectTolerance: 10,
    // browserNoActivityTimeout: 20000,
  });
};
