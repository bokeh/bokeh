Collection = require "../common/collection"
Transform = require "./transform"

class ToCounts extends Transform
  type: "ToCounts"

class ToCountss extends Collection
  model: ToCounts

module.exports =
  Model: ToCounts
  Collection: new ToCountss()