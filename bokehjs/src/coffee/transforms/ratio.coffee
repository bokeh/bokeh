Collection = require "../common/collection"
Transform = require "./transform"

class Ratio extends Transform
  type: "Ratio"

class Ratios extends Collection
  model: Ratio

module.exports =
  Model: Ratio
  Collection: new Ratios()