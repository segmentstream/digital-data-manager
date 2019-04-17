module.exports = function runGrunt(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wrap: {
      stage: {
        src: ['dist/segmentstream.js'],
        dest: 'dist/segmentstream.js',
        options: {
          wrapper: ['(function () { var define = undefined;', '})();'],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-wrap');
};
