module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');

  grunt.initConfig({

    sass: {
      options: {
        sourceMap: true,
        outputStyle: 'compressed',
        includePaths: ['scss/bourbon', 'scss/neat', 'scss/base']
      },
      dist: {
        files: {
          'css/docs.css': 'scss/docs.scss'
        }
      }
    },

    watch: {
      files: ['scss/*.*', 'scss/base/*.*'],
      tasks: ['sass:dist'],
    },

  });

  grunt.registerTask('default', ['sass']);
};
