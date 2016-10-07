# scripts - build or minify JS

_ = require "underscore"
browserify = require "browserify"
gulp = require "gulp"
gutil = util = require "gulp-util"
rename = require "gulp-rename"
transform = require "vinyl-transform"
replace = require "gulp-replace"
uglify = require "gulp-uglify"
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
{eco} = require '../eco'
ts = require 'gulp-typescript'

{namedLabeler} = require "../labeler"

gulp.task "scripts:coffee", () ->
  gulp.src('./src/coffee/**/*.coffee')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(coffee({bare: true}))
      .pipe(rename((path) -> path.extname = '.ts'))
      .pipe(gulp.dest(paths.buildDir.jsTree + '_ts'))

gulp.task "scripts:js", () ->
  gulp.src('./src/coffee/**/*.js')
      .pipe(rename((path) -> path.extname = '.ts'))
      .pipe(gulp.dest(paths.buildDir.jsTree + '_ts'))

gulp.task "scripts:eco", () ->
  gulp.src('./src/coffee/**/*.eco')
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(eco())
      .pipe(rename((path) -> path.extname = '.ts'))
      .pipe(gulp.dest(paths.buildDir.jsTree + '_ts'))

tsOpts = {
  noImplicitAny: true
  noEmitOnError: true
  module: "commonjs"
  moduleResolution: "node"
  target: "ES5"
  typescript: require('typescript')
}

gulp.task "scripts:ts", () ->
  gulp.src("./src/coffee/**/*.ts")
      .pipe(gulpif(argv.incremental, newer({dest: paths.buildDir.jsTree, ext: '.js'})))
      .pipe(ts(tsOpts, {}, ts.reporter.nullReporter()).on('error', (err) -> gutil.log(err.message)))
      .pipe(rename((path) -> path.extname = '.ts'))
      .pipe(gulp.dest(paths.buildDir.jsTree + '_ts'))

tsjsOpts = {
  noImplicitAny: false
  noEmitOnError: false
  module: "commonjs"
  moduleResolution: "node"
  target: "ES5"
  typescript: require('typescript')
}

gulp.task "scripts:tsjs", ["scripts:coffee", "scripts:js", "scripts:eco", "scripts:ts"], () ->
  gulp.src(paths.buildDir.jsTree + '_ts/**/*.ts')
      .pipe(ts(tsjsOpts, {}, ts.reporter.nullReporter()).on('error', (err) -> if argv.tsjs then gutil.log(err.message)))
      .pipe(gulp.dest(paths.buildDir.jsTree))

gulp.task "scripts:compile", ["scripts:tsjs"]

gulp.task "scripts:bundle", ["scripts:compile"], (cb) ->
  preludePath = path.resolve("./src/js/prelude.js")
  preludeText = fs.readFileSync(preludePath, { encoding: 'utf8' })

  bokehjsOpts = {
    entries: [path.resolve(path.join(paths.buildDir.jsTree, 'main.js'))]
    extensions: [".js"]
    debug: true
    preludePath: preludePath
    prelude: preludeText
  }

  bokehjs = browserify(bokehjsOpts)
  labels = {}

  buildBokehjs = (next) ->
    if argv.verbose then util.log("Building bokehjs")
    labels.bokehjs = namedLabeler(bokehjs, {})
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

  pluginPreludePath = path.resolve("./src/js/plugin-prelude.js")
  pluginPreludeText = fs.readFileSync(pluginPreludePath, { encoding: 'utf8' })

  mkBuildPlugin = (plugin_name, main) ->
    return (next) ->
      if argv.verbose then util.log("Building #{plugin_name}")
      pluginOpts = {
        entries: [path.resolve(path.join(paths.buildDir.jsTree, main))]
        extensions: [".js"]
        debug: true
        preludePath: pluginPreludePath
        prelude: pluginPreludeText
      }
      plugin = browserify(pluginOpts)
      labels[plugin_name] = namedLabeler(plugin, labels.bokehjs)
      for own file, name of labels.bokehjs
        plugin.external(file) if name != "_process"
      plugin
        .bundle()
        .pipe(source(paths.coffee[plugin_name].destination.full))
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

  buildAPI = mkBuildPlugin("api", "api.js")

  buildWidgets = mkBuildPlugin("widgets", 'models/widgets/main.js')

  writeLabels = (next) ->
    data = {}
    for own name, module_labels of labels
      data[name] = _.sortBy(_.values(module_labels), (module) -> module)
    modulesPath = path.join(paths.buildDir.js, "modules.json")
    fs.writeFile(modulesPath, JSON.stringify(data), () -> next())

  compilerOpts = {
    entries: [path.resolve(path.join('src', 'js', 'compile.coffee'))]
    extensions: [".js", ".coffee"]
    browserField: false
    builtins: false
    commondir: false
    insertGlobals: false
    insertGlobalVars: {
     process: undefined
     global: undefined
     'Buffer.isBuffer': undefined
     Buffer: undefined
    }
  }
  compiler = browserify(compilerOpts)
  buildCompiler = (next) ->
    compiler
      .transform("coffeeify")
      .bundle()
      .pipe(source("compile.js"))
      .pipe(gulp.dest(paths.buildDir.js))
      .on 'end', () -> next()

  buildBokehjs(() -> buildAPI(() -> buildWidgets(() -> writeLabels(() -> buildCompiler(cb)))))
  null # XXX: this is extremely important to allow cb() to work

gulp.task "scripts:build", ["scripts:bundle"]

gulp.task "scripts:minify", ["scripts:bundle"], ->
  tasks = [paths.coffee.bokehjs, paths.coffee.api, paths.coffee.widgets].map (entry) ->
    gulp.src(entry.destination.fullWithPath)
      .pipe(rename((path) -> path.basename += '.min'))
      .pipe(uglify({ output: {comments: /^!|copyright|license|\(c\)/i} }))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
  es.merge.apply(null, tasks)

gulp.task "scripts", ["scripts:build", "scripts:minify"]
