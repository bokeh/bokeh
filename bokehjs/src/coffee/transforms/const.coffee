Collection = require "../common/collection"
Transform = require "./transform"

class Const extends Transform
  type: "Const"

class Consts extends Collection
  model: Const

module.exports =
  Model: Const
  Collection: new Consts()