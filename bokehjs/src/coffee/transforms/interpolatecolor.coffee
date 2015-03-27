Collection = require "../common/collection"
Transform = require "./transform"

class InterpolateColor extends Transform
  type: "InterpolateColor"

class InterpolateColors extends Collection
  model: InterpolateColor

module.exports =
  Model: InterpolateColor
  Collection: new InterpolateColors()