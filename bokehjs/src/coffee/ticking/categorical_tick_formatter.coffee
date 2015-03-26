Collection = require "../common/collection"
HasProperties = require "../common/has_properties"

class CategoricalTickFormatter extends HasProperties
  type: 'CategoricalTickFormatter'

  format: (ticks) ->
    return ticks

class CategoricalTickFormatters extends Collection
  model: CategoricalTickFormatter

module.exports =
  Model: CategoricalTickFormatter
  Collection: new CategoricalTickFormatters()

