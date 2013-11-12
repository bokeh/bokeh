/*
 * grunt-contrib-qunit
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Create a local web server for testing http:// URIs.
    connect: {
      root_server: {
        options: {
          port: 9000,
          base: '.',
        },
      },
      test_server: {
        options: {
          port: 9001,
          base: 'test',
        },
      }
    },

    // Unit tests.
    qunit: {
      all_tests: ['test/*{1,2}.html'],
      individual_tests: {
        files: [
          {src: 'test/*1.html'},
          {src: 'test/*{1,2}.html'},
        ]
      },
      urls: {
        options: {
          urls: [
            'http://localhost:9000/test/qunit1.html',
            'http://localhost:9001/qunit2.html',
          ]
        },
      },
      urls_and_files: {
        options: {
          urls: '<%= qunit.urls.options.urls %>',
        },
        src: 'test/*{1,2}.html',
      },
    }

  });

  // Build a mapping of url success counters.
  var successes = {};
  var currentUrl;
  grunt.event.on('qunit.spawn', function(url) {
    currentUrl = url;
    if (!successes[currentUrl]) { successes[currentUrl] = 0; }
  });
  grunt.event.on('qunit.done', function(failed, passed) {
    if (failed === 0 && passed === 2) { successes[currentUrl]++; }
  });

  grunt.registerTask('really-test', 'Test to see if qunit task actually worked.', function() {
    var assert = require('assert');
    var difflet = require('difflet')({indent: 2, comment: true});
    var actual = successes;
    var expected = {
      'test/qunit1.html': 3,
      'test/qunit2.html': 3,
      'http://localhost:9000/test/qunit1.html': 2,
      'http://localhost:9001/qunit2.html': 2
    };
    try {
      assert.deepEqual(actual, expected, 'Actual should match expected.');
    } catch (err) {
      grunt.log.subhead('Actual should match expected.');
      console.log(difflet.compare(expected, actual));
      throw new Error(err.message);
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-internal');

  // Whenever the "test" task is run, run some basic tests.
  grunt.registerTask('test', ['connect', 'qunit', 'really-test']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test', 'build-contrib']);

};