import * as Numbro from "numbro"
import * as compile_template from "underscore.template"

import * as p from "core/properties"
import {span, i} from "core/dom"
import {extend} from "core/util/object"
import {isString} from "core/util/types"
import {Model} from "../../../model"

export class CellFormatter extends Model
  doFormat: (row, cell, value, columnDef, dataContext) ->
    if value == null
      return ""
    else
      return (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export class StringFormatter extends CellFormatter
  type: 'StringFormatter'

  @define {
    font_style: [ p.FontStyle, "normal" ]
    text_align: [ p.TextAlign, "left"   ]
    text_color: [ p.Color ]
  }

  doFormat: (row, cell, value, columnDef, dataContext) ->
    text = super(row, cell, value, columnDef, dataContext)

    font_style = @font_style
    text_align = @text_align
    text_color = @text_color

    if font_style? or text_align? or text_color?
      text = span({}, text)
      switch font_style
        when "bold"
          text.style.fontWeight = "bold"
        when "italic"
          text.style.fontStyle = "italic"

      if text_align?
        text.style.textAlign = text_align
      if text_color?
        text.style.color = text_color

      text = text.outerHTML

    return text

export class NumberFormatter extends StringFormatter
  type: 'NumberFormatter'

  @define {
    format:     [ p.String, '0,0'       ] # TODO (bev)
    language:   [ p.String, 'en'        ] # TODO (bev)
    rounding:   [ p.String, 'round'     ] # TODO (bev)
  }

  doFormat: (row, cell, value, columnDef, dataContext) ->
    format = @format
    language = @language
    rounding = switch @rounding
      when "round", "nearest"   then Math.round
      when "floor", "rounddown" then Math.floor
      when "ceil",  "roundup"   then Math.ceil
    value = Numbro.format(value, format, language, rounding)
    return super(row, cell, value, columnDef, dataContext)

export class BooleanFormatter extends CellFormatter
  type: 'BooleanFormatter'

  @define {
    icon: [ p.String, 'check' ]
  }

  doFormat: (row, cell, value, columnDef, dataContext) ->
    if !!value then i({class: @icon}).outerHTML else ""

export class DateFormatter extends CellFormatter
  type: 'DateFormatter'

  @define {
    format: [ p.String, 'yy M d' ]
  }

  getFormat: () ->
    format = @format
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
    #if name? then $.datepicker[name] else format
    format

  doFormat: (row, cell, value, columnDef, dataContext) ->
    value = if isString(value) then parseInt(value, 10) else value
    #date = $.datepicker.formatDate(@getFormat(), new Date(value))
    date = value
    return super(row, cell, date, columnDef, dataContext)

export class HTMLTemplateFormatter extends CellFormatter
  type: 'HTMLTemplateFormatter'

  @define {
    template: [ p.String, '<%= value %>' ]
  }

  doFormat: (row, cell, value, columnDef, dataContext) ->
    template = @template
    if value == null
      return ""
    else
      dataContext = extend({}, dataContext, {value: value})
      compiled_template = compile_template(template)
      return compiled_template(dataContext)
