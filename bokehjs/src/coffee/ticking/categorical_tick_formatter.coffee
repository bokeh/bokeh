define [
  "common/collection",
  "common/has_properties"
], (Collection, HasProperties) ->

  class CategoricalTickFormatter extends HasProperties
    type: 'CategoricalTickFormatter'

    initialize: (attrs, options) ->
      super(attrs, options)

    format: (ticks) ->
      return ticks

  class CategoricalTickFormatters extends Collection
    model: CategoricalTickFormatter

  return {
    "Model": CategoricalTickFormatter,
    "Collection": new CategoricalTickFormatters()
  }

