define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class CountCategories extends Transform
    type: "CountCategories"

  class CountCategoriess extends Collection
    model: CountCategories

  return {
    Model: CountCategories
    Collection: new CountCategoriess()
  }
