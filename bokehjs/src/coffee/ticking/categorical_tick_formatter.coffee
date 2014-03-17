define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class CategoricalTickFormatter extends HasProperties
    format: (ticks) ->
      return ticks

  class CategoricalTickFormatters extends Backbone.Collection
    model: CategoricalTickFormatter

  return {
    "Model": CategoricalTickFormatter,
    "Collection": new CategoricalTickFormatters()
  }

