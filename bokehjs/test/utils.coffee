moduleRequire = (name) ->
  require "#{__dirname}/../src/coffee/#{name}"

MockCanvasContext = {
  beginPath: () -> null
  clearRect: () -> null
  clip: () -> null
  fillRect: () -> null
  fillText: () -> null
  lineTo: () -> null
  measureText: () -> {'width': 1, 'ascent': 1}
  moveTo: () -> null
  rect: () -> null
  restore: () -> null
  rotate: () -> null
  save: () -> null
  scale: () -> null
  stroke: () -> null
  strokeRect: () -> null
  translate: () -> null
}

module.exports = {
  require: moduleRequire
  MockCanvasContext: MockCanvasContext
}
