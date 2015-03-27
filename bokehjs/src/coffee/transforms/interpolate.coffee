Collection = require "../common/collection"
Transform = require "./transform"

class Interpolate extends Transform
  type: "Interpolate"

class Interpolates extends Collection
  model: Interpolate

module.exports =
  Model: Interpolate
  Collection: new Interpolates()