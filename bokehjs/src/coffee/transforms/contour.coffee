Collection = require "../common/collection"
Transform = require "./transform"

class Contour extends Transform
  type: "Contour"

class Contours extends Collection
  model: Contour

module.exports =
  Model: Contour
  Collection: new Contours()