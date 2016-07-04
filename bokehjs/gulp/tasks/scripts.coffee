# scripts - build or minify JS

_ = require "underscore"
browserify = require "browserify"
gulp = require "gulp"
gutil = util = require "gulp-util"
rename = require "gulp-rename"
transform = require "vinyl-transform"
replace = require "gulp-replace"
uglify = require "gulp-uglify"
runSequence = require "run-sequence"
sourcemaps = require "gulp-sourcemaps"
source = require 'vinyl-source-stream'
buffer = require 'vinyl-buffer'
paths = require "../paths"
change = require "gulp-change"
es = require "event-stream"
fs = require "fs"
path = require "path"
shasum = require "shasum"
argv = require("yargs").argv
insert = require('gulp-insert')
license = '/*\n' + fs.readFileSync('../LICENSE.txt', 'utf-8') + '*/\n';

gulpif = require 'gulp-if'
newer = require 'gulp-newer'
coffee = require 'gulp-coffee'
eco = require '../eco'
ts = require 'gulp-typescript'

{namedLabeler} = require "../labeler"

gulp.task "scripts:coffee", () ->
  gulp.src('./src/coffee/**/*.coffee')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(coffee({bare: true}))
      .pipe(gulp.dest(paths.buildDir.jsTree))

gulp.task "scripts:eco", () ->
  gulp.src('./src/coffee/**/*.eco')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(eco())
      .pipe(gulp.dest(paths.buildDir.jsTree))

tsOpts = {
  noImplicitAny: true
  noEmitOnError: true
  module: "commonjs"
  moduleResolution: "node"
  target: "ES5"
}

gulp.task "scripts:ts", () ->
  gulp.src("./src/coffee/**/*.ts")
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(ts(tsOpts, {}, ts.reporter.nullReporter()).on('error', (err) -> gutil.log(err.message)))
      .pipe(gulp.dest(paths.buildDir.jsTree))

gulp.task "scripts:compile", ["scripts:coffee", "scripts:eco", "scripts:ts"]

gulp.task "scripts:build", ["scripts:compile"], (cb) ->
  preludePath = path.resolve("./src/js/prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  bokehjsOpts = {
    entries: [path.resolve(path.join(paths.buildDir.jsTree, 'main.js'))]
    extensions: [".js"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  preludePath = path.resolve("./src/js/plugin-prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  widgetsOpts = {
    entries: [path.resolve(path.join(paths.buildDir.jsTree, 'models/widgets/main.js'))]
    extensions: [".js"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  compilerOpts = {
    entries: [path.resolve(path.join(paths.buildDir.jsTree, 'compiler/main.js'))]
    extensions: [".js"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  bokehjs = browserify(bokehjsOpts)
  bokehjs.exclude("coffee-script")

  widgets = browserify(widgetsOpts)
  compiler = browserify(compilerOpts)

  labels = {}

  buildBokehjs = (next) ->
    if argv.verbose then util.log("Building bokehjs")
    labels = namedLabeler(bokehjs, {})
    bokehjs
      .bundle()
      .pipe(source(paths.coffee.bokehjs.destination.full))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      # This solves a conflict when requirejs is loaded on the page. Backbone
      # looks for `define` before looking for `module.exports`, which eats up
      # our backbone.
      .pipe change (content) ->
        "(function() { var define = undefined; return #{content} })()"
      .pipe change (content) ->
        "window.Bokeh = Bokeh = #{content}"
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildWidgets = (next) ->
    if argv.verbose then util.log("Building widgets")
    namedLabeler(widgets, labels)
    for own file, name of labels
      widgets.external(file) if name != "_process"
    widgets
      .bundle()
      .pipe(source(paths.coffee.widgets.destination.full))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      # This solves a conflict when requirejs is loaded on the page. Backbone
      # looks for `define` before looking for `module.exports`, which eats up
      # our backbone.
      .pipe change (content) ->
        "(function() { var define = undefined; return #{content} })()"
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildCompiler = (next) ->
    if argv.verbose then util.log("Building compiler")
    namedLabeler(compiler, labels)
    for own file, name of labels
      compiler.external(file) if name != "_process"
    compiler
      .bundle()
      .pipe(source(paths.coffee.compiler.destination.full))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      # This solves a conflict when requirejs is loaded on the page. Backbone
      # looks for `define` before looking for `module.exports`, which eats up
      # our backbone.
      .pipe change (content) ->
        "(function() { var define = undefined; return #{content} })()"
      .pipe(replace("function lex\(\) \{", "var lex = function foo\(\) \{"))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildBokehjs(() -> buildWidgets(() -> buildCompiler(cb)))
  null # XXX: this is extremely important to allow cb() to work

gulp.task "scripts:minify", ->
  tasks = [paths.coffee.bokehjs, paths.coffee.widgets, paths.coffee.compiler].map (entry) ->
    gulp.src(entry.destination.fullWithPath)
      .pipe(rename((path) -> path.basename += '.min'))
      .pipe(uglify({ output: {comments: /^!|copyright|license|\(c\)/i} }))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
  es.merge.apply(null, tasks)

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
