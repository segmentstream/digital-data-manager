/* eslint-disable */
const {
  series, ifWindows, rimraf, mkdirp,
} = require('nps-utils');

const buildDir = 'build';
const distDir = 'dist';

const createDist = mkdirp(distDir);
const createBuild = mkdirp(buildDir);
const cleanDist = rimraf(`${distDir}/*`);
const cleanBuild = rimraf(`${buildDir}/*`);

const browserifyDebug = 'browserify src/index.js -t babelify --debug | exorcist --base=./build build/segmentstream.js.map > build/segmentstream.js';
const browserifyProd = 'browserify src/index.js -t babelify > dist/segmentstream.js && grunt wrap && uglifyjs dist/segmentstream.js -c -m --output dist/segmentstream.min.js';

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
    standard: 'standard',
    buildTest: series(cleanBuild, createBuild, 'browserify test/index.test.js -t babelify --debug | exorcist --base=./build build/segmentstream-test.js.map > build/segmentstream-test.js'),
    mocha: 'mocha build/segmentstream-test.js',
    test: {
      default: series.nps('standard', 'buildTest', 'karma')
    },
    karma: {
      default: 'karma start'
    },
  },
};
