HasProperties = require "../common/has_properties"

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

module.exports =
  Model: CategoricalTicker

