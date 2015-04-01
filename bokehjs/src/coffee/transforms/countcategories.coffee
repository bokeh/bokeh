Collection = require "../common/collection"
Transform = require "./transform"

class CountCategories extends Transform
  type: "CountCategories"

class CountCategoriess extends Collection
  model: CountCategories

module.exports =
  Model: CountCategories
  Collection: new CountCategoriess()