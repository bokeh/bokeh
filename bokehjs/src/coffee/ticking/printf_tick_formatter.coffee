_ = require "underscore"
SPrintf = require "sprintf"
Collection = require "../common/collection"
HasProperties = require "../common/has_properties"

class PrintfTickFormatter extends HasProperties
  type: 'PrintfTickFormatter'

  format: (ticks) ->
    format = @get("format")
    labels = ( SPrintf.sprintf(format, tick) for tick in ticks )
    return labels

  defaults: () ->
    return _.extend {}, super(), {
      format: '%s'
    }

class PrintfTickFormatters extends Collection
  model: PrintfTickFormatter

module.exports =
  Model: PrintfTickFormatter
  Collection: new PrintfTickFormatters()