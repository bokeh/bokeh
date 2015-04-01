_ = require "underscore"
$ = require "jquery"
Numeral = require "../../vendor/numeral.js-1.5.3/numeral.js"
HasProperties = require "../common/has_properties"

class CellFormatter extends HasProperties
  formatterDefaults: {}

  format: (row, cell, value, columnDef, dataContext) ->
    if value == null
      return ""
    else
      return (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  defaults: () ->
    return _.extend {}, super(), @formatterDefaults

class StringFormatter extends CellFormatter
  type: 'StringFormatter'
  formatterDefaults:
    font_style: null
    text_align: null
    text_color: null

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

class NumberFormatter extends StringFormatter
  type: 'NumberFormatter'
  formatterDefaults:
    font_style: null
    text_align: null
    text_color: null
    format: '0,0'
    language: 'en'
    rounding: 'round'

  format: (row, cell, value, columnDef, dataContext) ->
    format = @get("format")
    language = @get("language")
    rounding = switch @get("rounding")
      when "round", "nearest"   then Math.round
      when "floor", "rounddown" then Math.floor
      when "ceil",  "roundup"   then Math.ceil
    value = Numeral.format(value, format, language, rounding)
    return super(row, cell, value, columnDef, dataContext)

class BooleanFormatter extends CellFormatter
  type: 'BooleanFormatter'
  formatterDefaults:
    icon: 'check'

  format: (row, cell, value, columnDef, dataContext) ->
    if !!value then $('<i>').addClass(@get("icon")).html() else ""

class DateFormatter extends CellFormatter
  type: 'DateFormatter'
  formatterDefaults:
    format: 'yy M d'

  getFormat: () ->
    format = @get("format")
    name = switch format
      when "ATOM", "W3C", "RFC-3339", "ISO-8601" then "ISO-8601"
      when "COOKIE"                              then "COOKIE"
      when "RFC-850"                             then "RFC-850"
      when "RFC-1036"                            then "RFC-1036"
      when "RFC-1123"                            then "RFC-1123"
      when "RFC-2822"                            then "RFC-2822"
      when "RSS", "RFC-822"                      then "RFC-822"
      when "TICKS"                               then "TICKS"
      when "TIMESTAMP"                           then "TIMESTAMP"
      else                                       null
    if name? then $.datepicker[name] else format

  format: (row, cell, value, columnDef, dataContext) ->
    value = if _.isString(value) then parseInt(value, 10) else value
    date = $.datepicker.formatDate(@getFormat(), new Date(value))
    return super(row, cell, date, columnDef, dataContext)

module.exports =
  String:
    Model: StringFormatter

  Number:
    Model: NumberFormatter

  Boolean:
    Model: BooleanFormatter

  Date:
    Model: DateFormatter