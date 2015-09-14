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
rootRequire = require("root-require")
pkg = rootRequire("./package.json")

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
  revModMap = {}
  depModMap = {}

  for own key, val of pkg.browser
    revModMap[path.resolve(val)] = key

  for own dep, ver of pkg.dependencies
    depPkg = rootRequire(path.join("node_modules", dep, "package.json"))
    if depPkg.main?
      depPath = path.resolve(path.join("node_modules", dep, depPkg.main))
      if not fs.existsSync(depPath)
        depPath = "#{depPath}.js"
      depModMap[depPath] = dep

  debugger

  modPath = row.id

  modName  = revModMap[modPath]
  modName ?= depModMap[modPath]
  modName ?= path
    .relative(cwd, modPath)
    .replace(/\.(coffee|js|eco)$/, "")
    .split(path.sep).join("/")
    .replace(/^(src\/(coffee|vendor)|node_modules)\//, "")

  if argv.verbose
    util.log("Processing #{modName}")

  modName

gulp.task "scripts:build", (cb) ->
  preludePath = path.resolve("./src/js/prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  bokehjsOpts = {
    entries: [path.resolve('./src/coffee/main.coffee')]
    extensions: [".coffee", ".eco"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  widgetsOpts = {
    entries: [path.resolve('./src/coffee/widget/main.coffee')]
    extensions: [".coffee", ".eco"]
    debug: true
  }

  bokehjs = browserify(bokehjsOpts)
  widgets = browserify(widgetsOpts)

  labels = {}

  buildBokehjs = (next) ->
    util.log("Building bokehjs")
    labels = namedLabeler(bokehjs)
    bokehjs
      .transform("browserify-eco")
      .transform("coffeeify")
      .bundle()
      .pipe(source(paths.bokehjs.coffee.destination.full))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      # This solves a conflict when requirejs is loaded on the page. Backbone
      # looks for `define` before looking for `module.exports`, which eats up
      # our backbone.
      .pipe change (content) ->
        "(function() { var define = undefined; #{content} })()"
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildWidgets = (next) ->
    util.log("Building widgets")
    namedLabeler(widgets)
    # XXX: widgets.external(bokehjs) should work as well, but doesn't
    for own file, name of labels
      widgets.external(file)
    widgets
      .transform("browserify-eco")
      .transform("coffeeify")
      .bundle()
      .pipe(source(paths.widgets.coffee.destination.full))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      # This solves a conflict when requirejs is loaded on the page. Backbone
      # looks for `define` before looking for `module.exports`, which eats up
      # our backbone.
      .pipe change (content) ->
        "(function() { var define = undefined; #{content} })()"
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildBokehjs () -> buildWidgets(cb)
  null # XXX: this is extremely important to allow cb() to work

gulp.task "scripts:minify", ->
  gulp.src paths.bokehjs.coffee.destination.fullWithPath
    .pipe rename (path) -> path.basename += '.min'
    .pipe sourcemaps.init
      loadMaps: true
    .pipe uglify()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
