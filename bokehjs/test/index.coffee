fs = require "fs"
path = require "path"
assert = require "assert"
rootRequire = require "root-require"
chalk = require "chalk"
{TSError} = require "ts-node"

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

  try
    return this.constructor._load(modulePath, this)
  catch err
    if err instanceof TSError
      console.error(prettyTSError(err))
      process.exit(1)
    else
      throw err

prettyTSError = (error) ->
  title = "#{chalk.red('⨯')} Unable to compile TypeScript"
  return "#{chalk.bold(title)}\n#{error.diagnostics.map((x) -> x.message).join('\n')}"

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
