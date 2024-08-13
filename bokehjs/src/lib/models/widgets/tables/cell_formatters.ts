import tz from "timezone"
import * as Numbro from "@bokeh/numbro"
import {_} from "underscore.template"

import * as p from "core/properties"
import {div, i} from "core/dom"
import {isExpr, isField, isValue} from "core/vectorization"
import {RoundingFunction} from "core/enums"
import {isNumber, isString} from "core/util/types"
import {to_fixed} from "core/util/string"
import {color2css, rgba2css} from "core/util/color"
import {Model} from "../../../model"
import {ColorMapper} from "../../mappers/color_mapper"
import {unreachable} from "core/util/assert"

export namespace CellFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface CellFormatter extends CellFormatter.Attrs {}

export abstract class CellFormatter extends Model {
  declare properties: CellFormatter.Props

  constructor(attrs?: Partial<CellFormatter.Attrs>) {
    super(attrs)
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    if (value == null) {
      return ""
    } else {
      return `${value}`.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
  }
}

export namespace StringFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellFormatter.Props & {
    font_style: p.FontStyleSpec
    text_align: p.TextAlignSpec
    text_color: p.ColorSpec
    background_color: p.ColorSpec
    nan_format: p.Property<string>
    null_format: p.Property<string>
  }
}

export interface StringFormatter extends StringFormatter.Attrs {}

export class StringFormatter extends CellFormatter {
  declare properties: StringFormatter.Props

  constructor(attrs?: Partial<StringFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StringFormatter.Props>(({Str}) => ({
      font_style: [ p.FontStyleSpec, {value: "normal"} ],
      text_align: [ p.TextAlignSpec, {value: "left"} ],
      text_color: [ p.ColorSpec, null ],
      background_color: [ p.ColorSpec, null ],
      nan_format: [ Str, "NaN"],
      null_format: [ Str, "(null)"],
    }))
  }

  override doFormat(_row: any, _cell: any, value: any, _columnDef: any, dataContext: any): string {
    const {font_style, text_align, text_color, background_color} = this

    if (Number.isNaN(value)) {
      value = this.nan_format
    } else if (value == null) {
      value = this.null_format
    }

    const text = div(value == null ? "" : `${value}`)

    // Font style
    let resolved_font_style
    if (isValue(font_style)) {
      resolved_font_style = font_style.value
    } else if (isField(font_style)) {
      resolved_font_style = dataContext[font_style.field]
    } else if (isExpr(font_style)) {
      // TODO
    } else {
      unreachable()
    }

    switch (resolved_font_style) {
      case "normal":
        // nothing to do
        break
      case "italic":
        text.style.fontStyle = "italic"
        break
      case "bold":
        text.style.fontWeight = "bold"
        break
      case "bold italic":
        text.style.fontStyle = "italic"
        text.style.fontWeight = "bold"
        break
    }

    // Text align
    if (isValue(text_align)) {
      text.style.textAlign = text_align.value
    } else if (isField(text_align)) {
      text.style.textAlign = dataContext[text_align.field]
    } else if (isExpr(text_align)) {
      // TODO
    } else {
      unreachable()
    }

    // Text color
    // Handle the most common case first : isValue and value == null
    if (isValue(text_color)) {
      if (text_color.value != null) {
        text.style.color = color2css(text_color.value)
      }
    } else if (isField(text_color)) {
      if (text_color.transform != null && text_color.transform instanceof ColorMapper) {
        const rgba_array = text_color.transform.rgba_mapper.v_compute([dataContext[text_color.field]])
        const [r, g, b, a] = rgba_array
        text.style.color = rgba2css([r, g, b, a])
      } else {
        text.style.color = color2css(dataContext[text_color.field])
      }
    } else if (isExpr(text_color)) {
      // TODO
    } else {
      unreachable()
    }

    // Background color
    if (isValue(background_color)) {
      if (background_color.value != null) {
        text.style.backgroundColor = color2css(background_color.value)
      }
    } else if (isField(background_color)) {
      if (background_color.transform != null && background_color.transform instanceof ColorMapper) {
        const rgba_array = background_color.transform.rgba_mapper.v_compute([dataContext[background_color.field]])
        const [r, g, b, a] = rgba_array
        text.style.backgroundColor = rgba2css([r, g, b, a])
      } else {
        text.style.backgroundColor = color2css(dataContext[background_color.field])
      }
    } else if (isExpr(background_color)) {
      // TODO
    } else {
      unreachable()
    }

    return text.outerHTML
  }
}

export namespace ScientificFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StringFormatter.Props & {

    precision: p.Property<number>
    power_limit_high: p.Property<number>
    power_limit_low: p.Property<number>
  }
}

export interface ScientificFormatter extends ScientificFormatter.Attrs {}

export class ScientificFormatter extends StringFormatter {
  declare properties: ScientificFormatter.Props

  constructor(attrs?: Partial<ScientificFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ScientificFormatter.Props>(({Float}) => ({
      precision:        [ Float, 10 ],
      power_limit_high: [ Float, 5 ],
      power_limit_low:  [ Float, -3 ],
    }))

    this.override<NumberFormatter.Props>({
      nan_format: "-",
      null_format: "-",
    })
  }

  get scientific_limit_low(): number {
    return 10.0**this.power_limit_low
  }

  get scientific_limit_high(): number {
    return 10.0**this.power_limit_high
  }

  override doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const need_sci = Math.abs(value) <= this.scientific_limit_low || Math.abs(value) >= this.scientific_limit_high
    let precision = this.precision

    // toExponential does not handle precision values < 0 correctly
    if (precision < 1) {
      precision = 1
    }

    if (Number.isNaN(value)) {
      value = this.nan_format
    } else if (value == null) {
      value = this.null_format
    } else if (value == 0) {
      value = to_fixed(value, 1)
    } else if (need_sci) {
      value = value.toExponential(precision)
    } else {
      value = to_fixed(value, precision)
    }

    // add StringFormatter formatting
    return super.doFormat(row, cell, value, columnDef, dataContext)
  }
}

export namespace NumberFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StringFormatter.Props & {
    format: p.Property<string>
    language: p.Property<string>
    rounding: p.Property<RoundingFunction>
  }
}

export interface NumberFormatter extends NumberFormatter.Attrs {}

export class NumberFormatter extends StringFormatter {
  declare properties: NumberFormatter.Props

  constructor(attrs?: Partial<NumberFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NumberFormatter.Props>(({Str}) => ({
      format:     [ Str,           "0,0"   ],
      language:   [ Str,           "en"    ],
      rounding:   [ RoundingFunction, "round" ],

    }))

    this.override<NumberFormatter.Props>({
      nan_format: "-",
      null_format: "-",
    })
  }

  override doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const {format, language, nan_format, null_format} = this
    const rounding = (() => {
      switch (this.rounding) {
        case "round": case "nearest":   return Math.round
        case "floor": case "rounddown": return Math.floor
        case "ceil":  case "roundup":   return Math.ceil
      }
    })()
    if (Number.isNaN(value)) {
      value = nan_format
    } else if (value == null) {
      value = null_format
    } else {
      value = Numbro.format(value, format, language, rounding)
    }
    return super.doFormat(row, cell, value, columnDef, dataContext)
  }
}

export namespace BooleanFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellFormatter.Props & {
    icon: p.Property<string> // XXX: enum
  }
}

export interface BooleanFormatter extends BooleanFormatter.Attrs {}

export class BooleanFormatter extends CellFormatter {
  declare properties: BooleanFormatter.Props

  constructor(attrs?: Partial<BooleanFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BooleanFormatter.Props>(({Str}) => ({
      icon: [ Str, "check" ],
    }))
  }

  override doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    return !!value ? i({class: this.icon}).outerHTML : ""
  }
}

export namespace DateFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StringFormatter.Props & {
    format: p.Property<string> // XXX: enum
  }
}

export interface DateFormatter extends DateFormatter.Attrs {}

export class DateFormatter extends StringFormatter {
  declare properties: DateFormatter.Props

  constructor(attrs?: Partial<DateFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DateFormatter.Props>(({Str}) => ({
      format: [ Str, "ISO-8601" ],
    }))

    this.override<NumberFormatter.Props>({
      nan_format: "-",
      null_format: "-",
    })
  }

  getFormat(): string | undefined {
    // using definitions provided here: https://api.jqueryui.com/datepicker/
    // except not implementing TICKS
    switch (this.format) {
      case "ATOM":
      case "W3C":
      case "RFC-3339":
      case "ISO-8601":
        return "%Y-%m-%d"
      case "COOKIE":
        return "%a, %d %b %Y"
      case "RFC-850":
        return "%A, %d-%b-%y"
      case "RFC-1123":
      case "RFC-2822":
        return "%a, %e %b %Y"
      case "RSS":
      case "RFC-822":
      case "RFC-1036":
        return "%a, %e %b %y"
      case "TIMESTAMP":
        return undefined
      default:
        return this.format
    }
  }

  override doFormat(row: any, cell: any, value: unknown, columnDef: any, dataContext: any): string {
    function parse(date: string) {
      /* Parse bare dates as UTC. */
      const has_tz = /Z$|[+-]\d\d((:?)\d\d)?$/.test(date) // ISO 8601 TZ designation or offset
      const iso_date = has_tz ? date : `${date}Z`
      return new Date(iso_date).getTime()
    }

    const epoch = (() => {
      if (value == null || isNumber(value)) {
        return value
      } else if (isString(value)) {
        const epoch = Number(value)
        return isNaN(epoch) ? parse(value) : epoch
      } else if (value instanceof Date) {
        return value.valueOf()
      } else {
        return Number(value)
      }
    })()

    const NaT = -9223372036854776.0

    const date = (() => {
      if (Number.isNaN(epoch) || epoch == NaT) {
        return this.nan_format
      } else if (value == null) {
        return this.null_format
      } else {
        return tz(epoch, this.getFormat())
      }
    })()

    return super.doFormat(row, cell, date, columnDef, dataContext)
  }
}

export namespace HTMLTemplateFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellFormatter.Props & {
    template: p.Property<string>
  }
}

export interface HTMLTemplateFormatter extends HTMLTemplateFormatter.Attrs {}

export class HTMLTemplateFormatter extends CellFormatter {
  declare properties: HTMLTemplateFormatter.Props

  constructor(attrs?: Partial<HTMLTemplateFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<HTMLTemplateFormatter.Props>(({Str}) => ({
      template: [ Str, "<%= value %>" ],
    }))
  }

  override doFormat(_row: any, _cell: any, value: any, _columnDef: any, dataContext: any): string {
    const {template} = this
    if (value == null) {
      return ""
    } else {
      const compiled_template = _.template(template)
      const context = {...dataContext, value}
      return compiled_template(context)
    }
  }
}
