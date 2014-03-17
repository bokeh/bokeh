define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class CategoricalTicker extends HasProperties
    get_ticks: (start, end, range, {desired_n_ticks}) ->
      return range.get("factors")

  class CategoricalTickers extends Backbone.Collection
    model: CategoricalTicker

    defaults: () ->
      super()

  return {
    "Model": CategoricalTicker,
    "Collection": new CategoricalTickers()
  }

