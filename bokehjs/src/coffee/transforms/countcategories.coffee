define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class CountCategories extends HasProperties
    type: "CountCategories"

  class CountCategoriess extends Collection
    model: CountCategories

  return {
    Model: CountCategories
    Collection: new CountCategoriess()
  }
