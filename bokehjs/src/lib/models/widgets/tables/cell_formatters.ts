import tz from "timezone"
import * as Numbro from "@bokeh/numbro"
import {_} from "underscore.template"

import type * as p from "core/properties"
import {div, i} from "core/dom"
import type {ColorSpecValue} from "core/types"
import {RoundingFunction} from "core/enums"
import type {FontStyleSpecValue, TextAlignSpecValue} from "core/enums"
import {isNumber, isString} from "core/util/types"
import {to_fixed} from "core/util/string"
import {color2css} from "core/util/color"
import {Model} from "../../../model"

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
    font_style: p.Property<FontStyleSpecValue>
    text_align: p.Property<TextAlignSpecValue>
    text_color: p.Property<ColorSpecValue | null>
    background_color: p.Property<ColorSpecValue | null>
    nan_format: p.Property<string>
  }
}

export interface StringFormatter extends StringFormatter.Attrs {}

export class StringFormatter extends CellFormatter {
  declare properties: StringFormatter.Props

  constructor(attrs?: Partial<StringFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StringFormatter.Props>(({ColorSpecValue, FontStyleSpecValue, TextAlignSpecValue, Nullable, String}) => ({
      font_style: [ FontStyleSpecValue, {value: "normal"} ],
      text_align: [ TextAlignSpecValue, {value: "left"}   ],
      text_color: [ Nullable(ColorSpecValue), null ],
      background_color: [ Nullable(ColorSpecValue), null ],
      nan_format: [ String, "-"],
    }))
  }

  override doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    const {font_style, text_align, text_color, background_color} = this

    const text = div(value == null ? "" : `${value}`)

    let resolvedFontStyle

    if ("value" in font_style) {
      resolvedFontStyle = font_style.value
    } else if ("field" in font_style) {
      resolvedFontStyle = _dataContext[font_style.field]
    } else {
      resolvedFontStyle = "normal"
    }

    switch (resolvedFontStyle) {
      case "normal":
        text.style.fontStyle = "normal"
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

    if ("value" in text_align) {
      text.style.textAlign = text_align.value
    } else if ("field" in text_align) {
      text.style.textAlign = _dataContext[text_align.field]
    }

    if (text_color != null) {
      if ("value" in text_color) {
        text.style.color = color2css(text_color.value)
      } else if ("field" in text_color) {
        text.style.color = _dataContext[text_color.field]
      }
    }

    if (background_color != null) {
      if ("value" in background_color) {
        text.style.backgroundColor = color2css(background_color.value)
      } else if ("field" in background_color) {
        text.style.backgroundColor = _dataContext[background_color.field]
      }
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
    this.define<ScientificFormatter.Props>(({Number}) => ({
      precision:        [ Number, 10 ],
      power_limit_high: [ Number, 5 ],
      power_limit_low:  [ Number, -3 ],
    }))
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

    if (value == null || isNaN(value)) {
      value = this.nan_format
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
    this.define<NumberFormatter.Props>(({String}) => ({
      format:     [ String,           "0,0"   ],
      language:   [ String,           "en"    ],
      rounding:   [ RoundingFunction, "round" ],

    }))
  }

  override doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const {format, language, nan_format} = this
    const rounding = (() => {
      switch (this.rounding) {
        case "round": case "nearest":   return Math.round
        case "floor": case "rounddown": return Math.floor
        case "ceil":  case "roundup":   return Math.ceil
      }
    })()
    if (value == null || isNaN(value)) {
      value = nan_format
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
    this.define<BooleanFormatter.Props>(({String}) => ({
      icon: [ String, "check" ],
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
    this.define<DateFormatter.Props>(({String}) => ({
      format: [ String, "ISO-8601" ],
    }))
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
      if (epoch == null || isNaN(epoch) || epoch == NaT) {
        return this.nan_format
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
    this.define<HTMLTemplateFormatter.Props>(({String}) => ({
      template: [ String, "<%= value %>" ],
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
