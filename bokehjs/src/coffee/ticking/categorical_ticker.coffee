define [
  "common/collection",
  "common/has_properties"
], (Collection, HasProperties) ->

  class CategoricalTicker extends HasProperties
    type: 'CategoricalTicker'

    get_ticks: (start, end, range, {desired_n_ticks}) ->
      majors = []
      factors = range.get("factors")
      for i in [0...factors.length]
        if (i+1) > start and (i+1) < end
          majors.push(factors[i])
      return {
        "major": majors
        "minor": []
      }

  class CategoricalTickers extends Collection
    model: CategoricalTicker

  return {
    "Model": CategoricalTicker,
    "Collection": new CategoricalTickers()
  }

