{TSError} = require "ts-node"
chalk = require "chalk"

prettyTSError = (error) ->
  title = "#{chalk.red('⨯')} Unable to compile TypeScript:"
  return "#{chalk.bold(title)}\n#{error.diagnostics.map((x) -> x.message).join('\n')}"

module.constructor.prototype.require = (modulePath) ->
  try
    return this.constructor._load(modulePath, this)
  catch err
    if err instanceof TSError
      console.error(prettyTSError(err))
      process.exit(1)
    else
      throw err

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
