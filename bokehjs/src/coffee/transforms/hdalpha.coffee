Collection = require "../common/collection"
Transform = require "./transform"

class HDAlpha extends Transform
  type: "HDAlpha"

class HDAlphas extends Collection
  model: HDAlpha

module.exports =
  Model: HDAlpha
  Collection: new HDAlphas()