module.exports = function(grunt) {
  'use strict';

  // Project configuration
  grunt.initConfig({

    jshint: {
      options: {
        curly:   true,
        eqeqeq:  true,
        immed:   true,
        latedef: true,
        newcap:  true,
        noarg:   true,
        sub:     true,
        undef:   true,
        boss:    true,
        eqnull:  true,
        node:    true
      },

      gruntfile: 'Gruntfile.js',
      tasks: 'tasks/*.js',
      tests: '<%= nodeunit.tests %>'
    },

    // Prepare clean testing ENV
    clean: {
      test: ['tmp']
    },

    eco: {
      filesTest: {
        files: {
          'tmp/filesTest/all.js': ['tests/fixtures/**/*.eco'],
          'tmp/filesTest/flatOnly.js': 'tests/fixtures/*.eco'
        }
      },

      srcDestTest: {
        src: ['tests/fixtures/**/*.eco'],
        dest: 'tmp/srcDestTest/all.js'
      },

      expandTest: {
        files: [{
          expand: true,
          src: 'tests/fixtures/**/*.eco',
          dest: 'tmp/expandTest',
          ext: '.js'
        }]
      },

      basePathTest: {
        src: ['tests/fixtures/**/*.eco'],
        dest: 'tmp/basePathTest/all.js',
        options: {
          basePath: 'tests/fixtures'
        }
      },

      amdTest: {
        options: {
          amd: true
        },
        files: [{
          expand: true,
          src: 'tests/fixtures/**/*.eco',
          dest: 'tmp/amdTest',
          ext: '.js'
        }]
      },

      noJstGlobalCheckTest: {
        options: {
          jstGlobalCheck: false
        },
        files: {
          'tmp/noJstGlobalCheckTest/all.js': 'tests/fixtures/**/*.eco'
        }
      }
    },

    nodeunit: {
      tests: ['tests/*_test.js']
    }
  });

  // Load local tasks
  grunt.loadTasks('tasks');

  // Load development tasks
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('test', ['clean', 'eco', 'nodeunit']);

};
