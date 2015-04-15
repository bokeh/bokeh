jsdom = require "jsdom"
SandboxedModule = require "sandboxed-module"

moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

# Bootstrap the dependencies that need special help
global._bokehTest =
  kiwi: require "../src/vendor/kiwi/kiwi"

jsdom.env "<html><body></body></html>", (error, window) ->
  global._bokehTest.Hammer = SandboxedModule.require "hammerjs",
    globals:
      window: window
      document: window.document

# Register the eco template loading
require "eco"



module.exports =
  require: moduleRequire
