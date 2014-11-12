define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Count extends HasProperties
    type: "Count"

  class Counts extends Collection
    model: Count

  return {
    Model: Count
    Collection: new Counts()
  }
