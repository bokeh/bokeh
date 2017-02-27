fs = require "fs"
path = require "path"
resolve = require "resolve"
through = require "through2"
gutil = require "gulp-util"
argv = require("yargs").argv
rootRequire = require("root-require")
pkg = rootRequire("./package.json")
paths = require "./paths"

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
        extensions: ['.js', '.coffee']
        paths: ['./node_modules', paths.buildDir.jsTree]
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
    .replace(/\.(coffee|js)$/, "")
    .split(path.sep).join("/")
    .replace(/^(src\/(coffee|vendor)|node_modules|build\/js\/tree)\//, "")

  if modName.indexOf("process/browser") != -1
    modName = "_process"

  if argv.verbose
    gutil.log("Processing #{modName}")

  modName

module.exports = {
  hashedLabeler: hashedLabeler
  namedLabeler: namedLabeler
}
