path = require "path"
assert = require "assert"
rootRequire = require("root-require")

root = rootRequire.packpath.parent()
pkg = rootRequire("./package.json")

module.constructor.prototype.require = (modulePath) ->
  assert(modulePath, 'missing path')
  assert(typeof modulePath == 'string', 'path must be a string')

  load = (modulePath) =>
    this.constructor._load(modulePath, this)

  overridePath = pkg.browser[modulePath]

  if overridePath?
    modulePath = path.join(root, overridePath)

  return load(modulePath)

if not (global.window? and global.document?)
  jsdom = require('jsdom').jsdom

  global.document = jsdom()
  global.window = document.defaultView

  for own name, object of global.window
    if not global[name]?
      global[name] = object

Bokeh = require './main'
module.exports = Bokeh
