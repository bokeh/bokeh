define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class AutoEncode extends HasProperties
    type: "AutoEncode"

  class AutoEncodes extends Collection
    model: AutoEncode

  return {
    Model: AutoEncode
    Collection: new AutoEncodes()
  }
