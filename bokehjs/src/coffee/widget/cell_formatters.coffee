define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "common/continuum_view"
], (_, $, HasProperties, Collection, ContinuumView) ->

  class CellFormatter extends HasProperties
  class CellFormatterCollection extends Collection
  class CellFormatterView extends ContinuumView

  class StringFormatterView extends CellFormatterView

  class StringFormatter extends CellFormatter
    type: 'StringFormatter'
    default_view: StringFormatterView

  class StringFormatters extends CellFormatterCollection
    model: StringFormatter

  class CheckmarkFormatterView extends CellFormatterView

  class CheckmarkFormatter extends CellFormatter
    type: 'CheckmarkFormatter'
    default_view: CheckmarkFormatterView

  class CheckmarkFormatters extends CellFormatterCollection
    model: CheckmarkFormatter

  return {
    String:
      Model: StringFormatter
      Collection: new StringFormatters()
      View: StringFormatterView

    Checkmark:
      Model: CheckmarkFormatter
      Collection: new CheckmarkFormatters()
      View: CheckmarkFormatterView
  }
