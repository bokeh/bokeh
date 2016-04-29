moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

MockContext = {
  beginPath: () -> null
  clip: () -> null
  fillRect: () -> null
  rect: () -> null
  restore: () -> null
  save: () -> null
  scale: () -> null
  strokeRect: () -> null
  translate: () -> null
}

module.exports = {
  require: moduleRequire
  MockContext: MockContext
}
