define [
  "backbone",
  "common/has_properties"
], (Backbone, HasProperties) ->

  class CategoricalTicker extends HasProperties
    type: 'CategoricalTicker'

    get_ticks: (start, end, range, {desired_n_ticks}) ->
      return {
        "major": range.get("factors")
        "minor": []
      }

  class CategoricalTickers extends Backbone.Collection
    model: CategoricalTicker

  return {
    "Model": CategoricalTicker,
    "Collection": new CategoricalTickers()
  }

