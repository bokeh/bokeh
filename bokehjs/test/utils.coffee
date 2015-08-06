SandboxedModule = require "sandboxed-module"

moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

# Bootstrap the dependencies that need special help
global._bokehTest =
  kiwi: require "../src/vendor/kiwi/kiwi"

# Register the eco template loading
require "eco"

module.exports =
  require: moduleRequire
