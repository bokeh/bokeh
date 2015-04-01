Collection = require "../common/collection"
Transform = require "./transform"

class Id extends Transform
  type: "Id"

class Ids extends Collection
  model: Id

module.exports =
  Model: Id
  Collection: new Ids()