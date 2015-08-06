SandboxedModule = require "sandboxed-module"

moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

# Register the eco template loading
require "eco"

module.exports =
  require: moduleRequire
