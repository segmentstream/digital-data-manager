const fs = require('fs')
const uuid = require('uuid')
// eslint-disable-next-line
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function init (config) {
  let customLaunchers
  let browsers
  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    /* eslint-disable */
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file if you want to test in diffirent browsers in the cloud.');
    } else {
      process.env.SAUCE_ENABLED = require('./sauce.json').enabled;
      process.env.SAUCE_USERNAME = require('./sauce.json').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce.json').accessKey;
    }
    /* eslint-enable */
  } else {
    process.env.SAUCE_ENABLED = true
  }

  if (process.env.SAUCE_ENABLED === 'true') {
    customLaunchers = {
      slChromeWin7: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7'
      },
      slFirefoxWin7: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '56'
      },
      slIe10Win7: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 7',
        version: '10'
      },
      slIe9Win7: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 7',
        version: '9'
      },
      slIe11Win10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 10',
        version: '11'
      },
      slME25Win10: {
        base: 'SauceLabs',
        browserName: 'microsoftedge',
        platform: 'Windows 10',
        version: '13'
      },
      slSafariOsx: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.10'
      },
      slIphone: {
        base: 'SauceLabs',
        browserName: 'Safari',
        platform: 'iOS',
        version: '10.3',
        deviceName: 'iPhone 6s Plus Simulator'
      },
      // commented out because of 10 minute test timeout limit
      // slIpad: {
      //   base: 'SauceLabs',
      //   browserName: 'Safari',
      //   platform: 'iOS',
      //   version: '10.3',
      //   deviceName: 'iPad Air Simulator',
      // },
      slAndroid: {
        base: 'SauceLabs',
        browserName: 'Browser',
        platform: 'Linux',
        version: '5.1',
        deviceName: 'Android Emulator'
      },
      slSamsungAndroid: {
        base: 'SauceLabs',
        browserName: 'Browser',
        platform: 'Android',
        version: '7.0',
        deviceName: 'Samsung Galaxy S8 HD GoogleAPI Emulator'
      }
    }
    browsers = Object.keys(customLaunchers)
  } else {
    customLaunchers = {
      PhantomJS_custom: {
        base: 'PhantomJS',
        options: {
          windowName: 'my-window',
          settings: {
            webSecurityEnabled: false
          }
        },
        flags: ['--load-images=true'],
        debug: false
      }
    }
    browsers = ['PhantomJS_custom']
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],

    plugins: [
      'karma-*',
      'mocha'
    ],

    client: {
      mocha: {
        timeout: 7000
      }
    },

    sauceLabs: {
      testName: 'Digital Data Manager Unit Tests',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER || uuid.v4(),
      recordScreenshots: false,
      startConnect: true
    },

    files: [
      './build/segmentstream-test.js'
    ],

    browsers,

    // you can define custom flags
    customLaunchers,

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: process.env.MOCHA ? ['mocha', 'saucelabs'] : ['dots', 'saucelabs'],

    mochaReporter: {
      showDiff: true
    },

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Increase timeout in case connection in CI is slow
    captureTimeout: 120000,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 1,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 10,
    browserNoActivityTimeout: 20000
  })
}
