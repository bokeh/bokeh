path = require "path"
assert = require "assert"

module.constructor.prototype.require = (modulePath) ->
  assert(modulePath, 'missing path')
  assert(typeof modulePath == 'string', 'path must be a string')

  self = this
  load = (modulePath) ->
    self.constructor._load(modulePath, self)

  root = process.cwd()
  pkg = load(path.join(root, "package.json"))

  overridePath = pkg.browser[modulePath]

  if overridePath?
    modulePath = path.join(root, overridePath)

  return load(modulePath)

jsdom = require('jsdom').jsdom

global.document = jsdom()
global.window = document.defaultView

blacklist = Object.keys(global)
blacklist.push('constructor')

for own key, val of global.window
  if blacklist.indexOf(key) == -1
    global[key] = val

global.HTMLElement = global.window.HTMLElement
global.Event = global.window.Event
global.Image = global.window.Image
global.atob = require "atob"
global.btoa = require "btoa"
