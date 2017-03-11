`
/// <reference path="./node.d.ts" />
`
import * as fs from "fs"
import * as path from "path"
import * as assert from "assert"
import * as rootRequire from "root-require"

root = rootRequire.packpath.parent()
pkg = rootRequire("./package.json")

module.constructor.prototype.require = (modulePath) ->
  assert(modulePath, 'missing path')
  assert(typeof modulePath == 'string', 'path must be a string')

  if not modulePath.startsWith(".")
    overridePath = pkg.browser[modulePath]

    if overridePath?
      modulePath = path.join(root, overridePath)
    else
      overridePath = path.join(root, path.dirname(pkg.main), modulePath + ".js")

      if fs.existsSync(overridePath)
        modulePath = overridePath

  return this.constructor._load(modulePath, this)

bokehjs = () ->
  if not window?.document?
    throw new Error("bokehjs requires a window with a document. If your
      runtime environment doesn't provide those, e.g. pure node.js, you
      can use jsdom library to configure window and document.")

  Bokeh = require './main'

  load_plugin = (path) ->
    plugin = require(path)
    Bokeh.Models.register_models(plugin.models)

    for name, obj of plugin
      if name != "models"
        Bokeh[name] = obj

  load_plugin('./api')
  load_plugin('./models/widgets/main')

  return Bokeh

module.exports = if window?.document? then bokehjs() else bokehjs
