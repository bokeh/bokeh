SandboxedModule = require "sandboxed-module"

moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

require "eco"

module.exports = {
  require: moduleRequire
}
