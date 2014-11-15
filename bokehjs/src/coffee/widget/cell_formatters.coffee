define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "common/continuum_view"
], (_, $, HasProperties, Collection, ContinuumView) ->

  class CellFormatter extends HasProperties

  class StringFormatterView extends ContinuumView

  class StringFormatter extends CellFormatter
    type: 'StringFormatter'
    default_view: StringFormatterView

  class StringFormatters extends Collection
    model: StringFormatter

  return {
    String:
      Model: StringFormatter
      Collection: new StringFormatters()
      View: StringFormatterView
  }
