module.exports = (grunt) ->
  fs = require("fs")

  # (task: String)(input: String) => Boolean
  hasChanged = (task) -> (input) ->
    cwd  = grunt.config.get("#{task}.cwd")
    dest = grunt.config.get("#{task}.dest")
    ext  = grunt.config.get("#{task}.ext")

    output = input.replace(cwd, dest)
                  .replace(/\..+$/, ext)

    if not fs.existsSync(output)
      true
    else
      fs.statSync(input).mtime > fs.statSync(output).mtime

  grunt.initConfig
    copy:
      template:
        files: [
          expand: true
          cwd: 'src/template'
          src: ['**/*.html', '**/*.eco']
          dest: 'build/template'
          filter: 'isFile'
        ]
      test:
        files: [
          expand: true
          cwd: 'test'
          src: ['**/*.html', '**/*.js']
          dest: 'build/test'
          filter: 'isFile'
        ]
      demo:
        files: [
          expand: true
          cwd: 'demo'
          src: ['**/*.html', '**/*.js', '**/*.css', '**/*.png', '**/*.py']
          dest: 'build/demo'
          filter: ['isFile']
        ]
      vendor:
        files: [
          expand: true
          cwd: 'src/vendor'
          src: ['**/*']
          dest : 'build/js/vendor'
        ]

    clean:
      all : ['build'],
      css : ['build/css/*.css']
    less:
      development:
        options:
          concat: false
        files: [{
          expand: true,        # enable dynamic expansion
          concat: false        # do not concatenate
          cwd: 'src/less',     # src matches are relative to this path
          src: ['bokeh.less'], # actual pattern(s) to match
          dest: 'build/css',   # destination path prefix
          ext: '.css',         # dest filepaths will have this extension
        }]
    lesslint:
      src: ['src/less/*.less']

    coffee:
      compile:
        expand: true           # enable dynamic expansion
        cwd: 'src/coffee'      # source dir for coffee files
        src: '**/*.coffee'     # traverse *.coffee files relative to cwd
        dest: 'build/js'       # destination for compiled js files
        ext: '.js'             # file extension for compiled files
        filter: hasChanged("coffee.compile")
        options:
          sourceMap : true
      test:
        expand: true           # enable dynamic expansion
        cwd: 'test'            # source dir for coffee files
        src: '**/*.coffee'     # traverse *.coffee files relative to cwd
        dest: 'build/test'     # destination for compiled js files
        ext: '.js'             # file extension for compiled files
        options:
          sourceMap : true
      demo:
        expand: true           # enable dynamic expansion
        cwd: 'demo/coffee'     # source dir for coffee files
        src: '**/*.coffee'     # traverse *.coffee files relative to cwd
        dest: 'build/demo/js'  # destination for compiled js files
        ext: '.js'             # file extension for compiled files
        options:
          sourceMap : true

    requirejs:
      options:
        logLevel: 2
        baseUrl: 'build/js'
        name: 'vendor/almond/almond'
        mainConfigFile: 'build/js/config.js'
        include: ['underscore', 'main']
        fileExclusionRegExp: /^test/
        wrapShim: true
        wrap:
          startFile: 'src/js/_start.js.frag'
          endFile: 'src/js/_end.js.frag'
      production:
        options:
          optimize: "uglify2"
          out: 'build/js/bokeh.min.js'
      development:
        options:
          optimize: "none"
          out: 'build/js/bokeh.js'

    cssmin:
      minify:
        expand: true
        cwd: "build/css"
        src: "bokeh.css"
        dest: "build/css"
        ext: '.min.css'

    watch:
      coffee:
        files: ["<%= coffee.compile.cwd %>/<%= coffee.compile.src %>"]
        tasks: ['coffee:compile']
        options:
          spawn: false
      demo:
        files: ["<%= coffee.demo.cwd %>/<%= coffee.demo.src %>"]
        tasks: ['coffee:demo']
        options:
            spawn: false
      demo_copy:
        files: ["demo/**/*.html", "demo/**/*.js"]
        tasks: ['copy:demo']
        options:
          spawn: false
      test:
        files: ["<%= coffee.test.cwd %>/<%= coffee.test.src %>"]
        tasks: ['coffee:test']
        options:
          spawn: false
      less:
        files: ["src/less/*"]
        tasks: ['clean:css', 'less']
        options:
          spawn: false
      eco:
        files: ["<%= eco.app.files[0].cwd %>/<%= eco.app.files[0].src %>"]
        tasks: ['eco']
        options:
          spawn: false

    connect:
      server:
        options:
          port: 8000,
          base: '.'

    qunit:
      all:
        options:
          urls:[
            'http://localhost:8000/build/test/common_test.html',
            'http://localhost:8000/build/test/mapper_test.html',
            'http://localhost:8000/build/test/range_test.html',
            'http://localhost:8000/build/test/source_test.html',
          ]

    groc:
      coffee: [ "docs/*.coffee", "docs/*.md", "README.md" ]
      options:
        out: "docs/html/"

    eco:
      app:
        options:
          amd: true
        files: [
          expand : true
          cwd: 'src/coffee'
          src : ['**/*.eco']
          ext : '.js'
          dest: 'build/js'
          filter: hasChanged("eco.app.files.0")
        ]

  grunt.loadNpmTasks("grunt-contrib-coffee")
  grunt.loadNpmTasks("grunt-contrib-watch")
  grunt.loadNpmTasks("grunt-contrib-less")
  grunt.loadNpmTasks("grunt-contrib-requirejs")
  grunt.loadNpmTasks("grunt-contrib-cssmin")
  grunt.loadNpmTasks("grunt-contrib-copy")
  grunt.loadNpmTasks("grunt-contrib-clean")
  grunt.loadNpmTasks("grunt-contrib-qunit")
  grunt.loadNpmTasks("grunt-contrib-connect")
  grunt.loadNpmTasks("grunt-eco")
  grunt.loadNpmTasks("grunt-groc")
  grunt.loadNpmTasks('grunt-lesslint')

  grunt.registerTask("default",   ["build", "test"])
  grunt.registerTask("buildcopy", ["copy:template", "copy:test", "copy:demo", "copy:vendor"]) # better way??
  grunt.registerTask("build",     ["coffee", "less", "buildcopy", "eco"])
  grunt.registerTask("deploy",    ["build",  "requirejs", "cssmin"])
  grunt.registerTask("test",      ["build", "connect", "qunit"])
  grunt.registerTask("fast_test", ["copy:test", "coffee:test", "connect", "qunit"])
  grunt.registerTask("serve",     ["connect:server:keepalive"])
  grunt.registerTask("release",   ["deploy", "copy:release"])
