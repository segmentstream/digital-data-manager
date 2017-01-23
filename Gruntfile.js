var fs = require('fs');

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        compress: {
            build: {
                options: {
                    mode: 'gzip'
                },
                files: [
                  { src: ['dist/dd-manager.min.js'], dest: 'deploy/dd-manager.js' }
                ]
            }
        },
        clean: {
            pre_build: ['deploy/dd-manager.js']
        },
        aws: grunt.file.readJSON('aws-keys.json'),
        aws_s3: {
            options: {
                accessKeyId: '<%= aws.AWSAccessKeyId %>', // Use the variables
                secretAccessKey: '<%= aws.AWSSecretKey %>', // You can also use env variables
                region: 'eu-west-1',
                params: {
                    CacheControl: 'max-age=86400',
                    ContentEncoding: 'gzip'
                }
            },
            staging: {
                options: {
                    bucket: 'cdn.ddmanager.ru',
                    differential: true, // Only uploads the files that have changed
                    gzipRename: 'ext' // when uploading a gz file, keep the original extension
                },
                files: [
                    {
                        expand: true,
                        cwd: 'deploy',
                        src: ['**'],
                        dest: 'sdk/'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-aws-s3');

    // Default task(s).
    grunt.registerTask('build', [
        'clean:pre_build',
        'compress',
        'aws_s3'
    ]);
};
