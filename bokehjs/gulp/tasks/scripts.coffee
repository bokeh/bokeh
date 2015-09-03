# scripts - build or minify JS

browserify = require "browserify"
gulp = require "gulp"
util = require "gulp-util"
rename = require "gulp-rename"
transform = require "vinyl-transform"
uglify = require "gulp-uglify"
runSequence = require "run-sequence"
sourcemaps = require "gulp-sourcemaps"
source = require 'vinyl-source-stream'
buffer = require 'vinyl-buffer'
paths = require "../paths"
change = require "gulp-change"
through = require "through2"
fs = require "fs"
path = require "path"
shasum = require "shasum"
argv = require("yargs").argv
pkg = require("root-require")("./package.json")

customLabeler = (b, fn) ->
  labels = {}

  namer = through.obj (row, enc, next) ->
    labels[row.id] = fn(row)
    @push(row)
    next()

  labeler = through.obj (row, enc, next) ->
    row.id = labels[row.id]

    for own key, dep of row.deps
      row.deps[key] = labels[dep]

    @push(row)
    next()

  b.pipeline.get('deps').push(namer)
  b.pipeline.get('label').splice(0, 1, labeler)

  labels

hashedLabeler = (b) -> customLabeler b, (row) ->
  shasum(row.source)

namedLabeler = (b) -> customLabeler b, (row) ->
  cwd = process.cwd()
  rev_mod_map = {}

  for own key, val of pkg.browser
    rev_mod_map[path.resolve(val)] = key

  name  = rev_mod_map[row.id]
  name ?= path
    .relative(cwd, row.id)
    .replace(/\.(coffee|js|eco)$/, "")
    .split(path.sep).join("/")
    .replace(/^(src\/(coffee|vendor)|node_modules)\//, "")

  if argv.verbose
    util.log("Processing #{name}")

  name

gulp.task "scripts:build", ->
  preludePath = path.resolve(process.cwd(), "./src/js/prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  opts =
    entries: ['./src/coffee/main.coffee']
    extensions: [".coffee", ".eco"]
    debug: true
    preludePath: preludePath
    prelude: preludeText

  b = browserify opts
  namedLabeler(b)

  b .transform "browserify-eco"
    .transform "coffeeify"
    .bundle()
    .pipe source paths.coffee.destination.full
    .pipe buffer()
    .pipe sourcemaps.init
      loadMaps: true
    # This solves a conflict when requirejs is loaded on the page. Backbone
    # looks for `define` before looking for `module.exports`, which eats up
    # our backbone.
    .pipe change (content) ->
      "(function() { var define = undefined; #{content} })()"
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts:minify", ->
  gulp.src paths.coffee.destination.fullWithPath
    .pipe rename (path) -> path.basename += '.min'
    .pipe sourcemaps.init
      loadMaps: true
    .pipe uglify()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
