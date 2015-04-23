HasProperties = require "../common/has_properties"

class CategoricalTickFormatter extends HasProperties
  type: 'CategoricalTickFormatter'

  format: (ticks) ->
    return ticks

module.exports =
  Model: CategoricalTickFormatter

