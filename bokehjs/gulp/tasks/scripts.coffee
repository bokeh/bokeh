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
stripAnsi = require('strip-ansi')
rootRequire = require("root-require")

license = '/*\n' + fs.readFileSync('../LICENSE.txt', 'utf-8') + '*/\n';

gulpif = require 'gulp-if'
newer = require 'gulp-newer'
coffee = require 'gulp-coffee'
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

gulp.task "scripts:ts", () ->
  prefix = "./src/coffee/**"
  gulp.src(["#{prefix}/*.ts", "#{prefix}/*.tsx"])
      .pipe(gulp.dest(paths.buildDir.jsTree + '_ts'))

tsconfig = rootRequire("./tsconfig.json")

gulp.task "scripts:tsjs", ["scripts:coffee", "scripts:js", "scripts:ts"], () ->
  error = (err) ->
    raw = stripAnsi(err.message)
    result = raw.match(/(.*)(\(\d+,\d+\): error TS(\d+):.*)/)

    if result?
      [_match, file, rest, code] = result
      real = path.join('src', 'coffee', file.split(path.sep)[3...]...)
      if fs.existsSync(real)
        gutil.log("#{gutil.colors.red(real)}#{rest}")
        return

      if code in ["2307", "2688", "6053"]
        gutil.log(err.message)
        return

    if not argv.ts?
      return

    if typeof argv.ts == "string"
      keywords = argv.ts.split(",")
      for keyword in keywords
        must = true
        if keyword[0] == "^"
          keyword = keyword[1..]
          must = false
        found = err.message.indexOf(keyword) != -1
        if not ((found and must) or (not found and not must))
          return

    gutil.log(err.message)

  prefix = paths.buildDir.jsTree + '_ts/**'
  gulp.src(["#{prefix}/*.ts", "#{prefix}/*.tsx"])
      .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))
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
    paths: ['./node_modules', paths.buildDir.jsTree]
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
        paths: ['./node_modules', paths.buildDir.jsTree]
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

  buildBokehjs(() -> buildAPI(() -> buildWidgets(() -> writeLabels(cb))))
  null # XXX: this is extremely important to allow cb() to work

gulp.task "scripts:build", ["scripts:bundle"]

gulp.task "compiler:build", ->
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
  browserify(compilerOpts)
    .transform("coffeeify")
    .bundle()
    .pipe(source("compile.js"))
    .pipe(gulp.dest(paths.buildDir.js))

gulp.task "scripts:minify", ["scripts:bundle"], ->
  tasks = [paths.coffee.bokehjs, paths.coffee.api, paths.coffee.widgets].map (entry) ->
    gulp.src(entry.destination.fullWithPath)
      .pipe(rename((path) -> path.basename += '.min'))
      .pipe(uglify({ output: {comments: /^!|copyright|license|\(c\)/i} }))
      .pipe(insert.append(license))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.buildDir.js))
  es.merge.apply(null, tasks)

gulp.task "scripts", ["scripts:build", "scripts:minify", "compiler:build"]
