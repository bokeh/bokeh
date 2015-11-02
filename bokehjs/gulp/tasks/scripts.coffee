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
es = require "event-stream"
fs = require "fs"
path = require "path"
shasum = require "shasum"
argv = require("yargs").argv
resolve = require "resolve"
rootRequire = require("root-require")
pkg = rootRequire("./package.json")
insert = require('gulp-insert')
license = '/*\n' + fs.readFileSync('../LICENSE.txt', 'utf-8') + '*/\n';

customLabeler = (bundle, parentLabels, fn) ->
  labels = {}

  namer = through.obj (row, enc, next) ->
    labels[row.id] = fn(row)
    @push(row)
    next()

  labeler = through.obj (row, enc, next) ->
    row.id = labels[row.id]

    for own name, dep of row.deps
      opts = {
        basedir: path.dirname(row.file)
        extensions: ['.js', '.coffee', '.eco']
      }

      if not dep?
        dep = pkg.browser[name]

        if dep?
          dep = path.resolve(dep)
        else
          dep = resolve.sync(name, opts)

      row.deps[name] = labels[dep] or parentLabels?[dep]

    @push(row)
    next()

  bundle.pipeline.get('deps').push(namer)
  bundle.pipeline.get('label').splice(0, 1, labeler)

  labels

hashedLabeler = (bundle, parentLabels) -> customLabeler bundle, parentLabels, (row) ->
  shasum(row.source)

namedLabeler = (bundle, parentLabels) -> customLabeler bundle, parentLabels, (row) ->
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

  preludePath = path.resolve("./src/js/plugin-prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  widgetsOpts = {
    entries: [path.resolve('./src/coffee/widget/main.coffee')]
    extensions: [".coffee", ".eco"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  bokehjs = browserify(bokehjsOpts)
  widgets = browserify(widgetsOpts)

  labels = {}

  buildBokehjs = (next) ->
    if argv.verbose then util.log("Building bokehjs")
    labels = namedLabeler(bokehjs, {})
    bokehjs
      .transform("browserify-eco")
      .transform("coffeeify")
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
        "bokehRequire = #{content}"
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildWidgets = (next) ->
    if argv.verbose then util.log("Building widgets")
    namedLabeler(widgets, labels)
    for own file, name of labels
      widgets.external(file)
    widgets
      .transform("browserify-eco")
      .transform("coffeeify")
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

  buildBokehjs () -> buildWidgets(cb)
  null # XXX: this is extremely important to allow cb() to work

gulp.task "scripts:minify", ->
  tasks = [paths.coffee.bokehjs, paths.coffee.widgets].map (entry) ->
    gulp.src(entry.destination.fullWithPath)
      .pipe(rename((path) -> path.basename += '.min'))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify({ output: {comments: /^!|copyright|license|\(c\)/i} }))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
  es.merge.apply(null, tasks)

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
