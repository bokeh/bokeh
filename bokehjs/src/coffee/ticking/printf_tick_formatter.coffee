define [
  "underscore"
  "sprintf"
  "common/collection"
  "common/has_properties"
], (_, SPrintf, Collection, HasProperties) ->

  class PrintfTickFormatter extends HasProperties
    type: 'PrintfTickFormatter'

    format: (ticks) ->
      format = @get("format")
      labels = ( SPrintf.sprintf(format, tick) for tick in ticks )
      return labels

    defaults: ->
      return _.extend {}, super(), {
        format: '%s'
      }

  class PrintfTickFormatters extends Collection
    model: PrintfTickFormatter

  return {
    Model: PrintfTickFormatter,
    Collection: new PrintfTickFormatters()
  }
