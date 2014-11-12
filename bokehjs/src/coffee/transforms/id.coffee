define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Id extends HasProperties
    type: "Id"

  class Ids extends Collection
    model: Id

  return {
    Model: Id
    Collection: new Ids()
  }
