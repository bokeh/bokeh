# scripts - build or minify JS

_ = require "underscore"
browserify = require "browserify"
gulp = require "gulp"
gutil = util = require "gulp-util"
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
child_process = require "child_process"
license = '/*\n' + fs.readFileSync('../LICENSE.txt', 'utf-8') + '*/\n';

gulpif = require 'gulp-if'
newer = require 'gulp-newer'
coffee = require 'gulp-coffee'
eco = require '../eco'

gulp.task "scripts:coffee", ["scripts:generate"], () ->
  gulp.src('./src/coffee/**/*.coffee')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(coffee({bare: true}).on('error', gutil.log))
      .pipe(gulp.dest(paths.buildDir.jsTree))

gulp.task "scripts:eco", () ->
  gulp.src('./src/coffee/**/*.eco')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(eco().on('error', gutil.log))
      .pipe(gulp.dest(paths.buildDir.jsTree))

gulp.task "scripts:compile", ["scripts:coffee", "scripts:eco"]

gulp.task "scripts:generate", (cb) ->
  generateDefaults = (next) ->
    if argv.verbose then util.log("Generating defaults.coffee")
    bokehjsdir = path.normalize(process.cwd())
    basedir = path.normalize(bokehjsdir + "/..")
    oldpath = process.env['PYTHONPATH']
    if oldpath?
      pypath = "#{basedir}:#{oldpath}"
    else
      pypath = basedir
    env = _.extend({}, process.env, { PYTHONPATH: pypath })
    handle = child_process.spawn("python", ['./gulp/tasks/generate_defaults.py', paths.buildDir.coffee], {
      env: env,
      cwd: bokehjsdir
    })
    handle.stdout.on 'data', (data) ->
      console.log("generate_defaults.py: #{data}")
    handle.stderr.on 'data', (data) ->
      console.log("generate_defaults.py: #{data}")
    handle.on 'close', (code) ->
      if code != 0
        cb(new Error("generate_defaults.py exited code #{code}"))
      else
        cb()

  generateDefaults(cb)
  null # XXX: this is extremely important to allow cb() to work

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
    .replace(/^(src\/(coffee|vendor)|node_modules|build\/js\/tree)\//, "")
    .replace("browserify/node_modules/process/browser", "_process")

  if argv.verbose
    util.log("Processing #{modName}")

  modName

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
    entries: [path.resolve(path.join(paths.buildDir.jsTree, 'widget/main.js'))]
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
