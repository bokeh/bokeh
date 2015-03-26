Collection = require "../common/collection"
Transform = require "./transform"

class Spread extends Transform
  type: "Spread"

class Spreads extends Collection
  model: Spread

module.exports =
  Model: Spread
  Collection: new Spreads()