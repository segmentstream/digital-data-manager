/* eslint-disable */
const {
  series, ifWindows, rimraf, mkdirp,
} = require('nps-utils');

const buildDir = 'build';
const distDir = 'dist';

const createDist = mkdirp(distDir);
const createBuild = mkdirp(buildDir);
const cleanDist = rimraf(distDir + '/*');
const cleanBuild = rimraf(buildDir + '/*');

const browserifyDebug = 'browserify src/index.js -t babelify --debug | exorcist --base=./build build/dd-manager.js.map > build/dd-manager.js';
const browserifyProd = 'browserify src/index.js -t babelify > dist/dd-manager.js && grunt wrap && uglifyjs dist/dd-manager.js -c -m --output dist/dd-manager.min.js';

module.exports = {
  scripts: {
    build: {
      default:
      {
        description: 'This uses for debug purpose. Creates dd.manager.js and its map.',
        script: series(cleanBuild, createBuild, browserifyDebug),
      },
      prod:
      {
        description: 'Prepare for deploy. JS + minimize',
        script: series(cleanDist, createDist, browserifyProd),
      },
    },
    lint: 'eslint src',
    buildSnippet: './scripts/snippet/build',
    buildTest: series(cleanBuild, createBuild, 'browserify test/index.test.js -t babelify --debug | exorcist --base=./build build/dd-manager-test.js.map > build/dd-manager-test.js'),
    mocha: 'mocha build/dd-manager-test.js',
    test: {
      default: series.nps('buildTest', 'karma'), dev: series.nps('buildTest', 'karma.dev')
    },
    karma: {
      default: `karma start karma.conf.js ${ifWindows('--browsers=ChromeHeadless', '')}`, dev:'cross-env MOCHA=1 karma start karma.conf.js --browsers=ChromeHeadless'
    },
  },
};
