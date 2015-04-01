Collection = require "../common/collection"
Transform = require "./transform"

class Encode extends Transform
  type: "Encode"

class Encodes extends Collection
  model: Encode

module.exports =
  Model: Encode
  Collection: new Encodes()