define [
  "underscore"
  "jquery"
  "common/has_properties"
  "common/collection"
  "numeral"
], (_, $, HasProperties, Collection, Numeral) ->

  class CellFormatter extends HasProperties

    format: (row, cell, value, columnDef, dataContext) ->
      if value == null
        return ""
      else
        return (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  class CellFormatterCollection extends Collection

    formatterDefaults: {}
    defaults: -> return _.extend {}, super(), @formatterDefaults

  class StringFormatter extends CellFormatter
    type: 'StringFormatter'

    format: (row, cell, value, columnDef, dataContext) ->
      text = super(row, cell, value, columnDef, dataContext)

      font_style = @get("font_style")
      text_align = @get("text_align")
      text_color = @get("text_color")

      if font_style? or text_align? or text_color?
        text = $("<span>#{text}</span>")
        switch font_style
          when "bold"   then text = text.css("font-weight", "bold")
          when "italic" then text = text.css("font-style",  "italic")
        if text_align? then text = text.css("text-align", text_align)
        if text_color? then text = text.css("color",      text_color)
        text = text.prop('outerHTML')

      return text

  class StringFormatters extends CellFormatterCollection
    model: StringFormatter
    formatterDefaults:
      font_style: null
      text_align: null
      text_color: null

  class NumberFormatter extends StringFormatter
    type: 'NumberFormatter'

    format: (row, cell, value, columnDef, dataContext) ->
      Numeral.language(@get("language"))
      value = Numeral(value).format(@get("format"))
      return super(row, cell, value, columnDef, dataContext)

  class NumberFormatters extends CellFormatterCollection
    model: NumberFormatter
    formatterDefaults:
      font_style: null
      text_align: null
      text_color: null
      format: '0,0'
      language: 'en'

  class BooleanFormatter extends CellFormatter
    type: 'BooleanFormatter'

    format: (row, cell, value, columnDef, dataContext) ->
      if !!value then $('<i>').addClass(@get("icon")).html() else ""

  class BooleanFormatters extends CellFormatterCollection
    model: BooleanFormatter
    formatterDefaults:
      icon: 'check'

  return {
    String:
      Model: StringFormatter
      Collection: new StringFormatters()

    Number:
      Model: NumberFormatter
      Collection: new NumberFormatters()

    Boolean:
      Model: BooleanFormatter
      Collection: new BooleanFormatters()
  }
