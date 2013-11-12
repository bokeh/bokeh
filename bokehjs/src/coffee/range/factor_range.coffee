

define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class FactorRange extends HasProperties
    type: 'FactorRange'

    defaults: () ->
      return {
        values: []
      }

  class FactorRanges extends Backbone.Collection
    model: FactorRange

  return {
    "Model": FactorRange,
    "Collection": new FactorRanges()
  }