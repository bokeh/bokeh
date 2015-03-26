Collection = require "../common/collection"
Transform = require "./transform"

class AutoEncode extends Transform
  type: "AutoEncode"

class AutoEncodes extends Collection
  model: AutoEncode

module.exports =
  Model: AutoEncode
  Collection: new AutoEncodes()