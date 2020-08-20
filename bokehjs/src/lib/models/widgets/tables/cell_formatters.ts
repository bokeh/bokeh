import tz from "timezone"
import * as Numbro from "@bokeh/numbro"
import {_} from "underscore.template"

import * as p from "core/properties"
import {div, i} from "core/dom"
import {Color} from "core/types"
import {FontStyle, TextAlign, RoundingFunction} from "core/enums"
import {isString} from "core/util/types"
import {Model} from "../../../model"

export namespace CellFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface CellFormatter extends CellFormatter.Attrs {}

export abstract class CellFormatter extends Model {
  properties: CellFormatter.Props

  constructor(attrs?: Partial<CellFormatter.Attrs>) {
    super(attrs)
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    if (value == null)
      return ""
    else
      return (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }
}

export namespace StringFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CellFormatter.Props & {
    font_style: p.Property<FontStyle>
    text_align: p.Property<TextAlign>
    text_color: p.Property<Color>
  }
}

export interface StringFormatter extends StringFormatter.Attrs {}

export class StringFormatter extends CellFormatter {
  properties: StringFormatter.Props

  constructor(attrs?: Partial<StringFormatter.Attrs>) {
    super(attrs)
  }

  static init_StringFormatter(): void {
    this.define<StringFormatter.Props>({
      font_style: [ p.FontStyle, "normal" ],
      text_align: [ p.TextAlign, "left"   ],
      text_color: [ p.Color ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    const {font_style, text_align, text_color} = this

    const text = div({}, value == null ? "" : `${value}`)
    switch (font_style) {
      case "bold":
        text.style.fontWeight = "bold"
        break
      case "italic":
        text.style.fontStyle = "italic"
        break
    }

    if (text_align != null)
      text.style.textAlign = text_align
    if (text_color != null)
      text.style.color = text_color

    return text.outerHTML
  }
}

export namespace ScientificFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StringFormatter.Props & {
    nan_format: p.Property<string>
    precision: p.Property<number>
    power_limit_high: p.Property<number>
    power_limit_low: p.Property<number>
  }
}

export interface ScientificFormatter extends ScientificFormatter.Attrs {}

export class ScientificFormatter extends StringFormatter {
  properties: ScientificFormatter.Props

  constructor(attrs?: Partial<ScientificFormatter.Attrs>) {
    super(attrs)
  }

  static init_ScientificFormatter(): void {
    this.define<ScientificFormatter.Props>({
      nan_format:       [ p.String ],
      precision:        [ p.Number,  10     ],
      power_limit_high: [ p.Number,  5      ],
      power_limit_low:  [ p.Number,  -3     ],
    })
  }

  get scientific_limit_low(): number {
    return 10.0**this.power_limit_low
  }

  get scientific_limit_high(): number {
    return 10.0**this.power_limit_high
  }

  doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const need_sci = value <= this.scientific_limit_low || value >= this.scientific_limit_high
    let precision = this.precision

    // toExponential does not handle precision values < 0 correctly
    if (precision < 1) {
      precision = 1
    }

    if ((value == null || isNaN(value)) && this.nan_format != null)
      value = this.nan_format
    else if (need_sci) {
      value = value.toExponential(precision)
    } else {
      value = value.toFixed(precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
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
    nan_format: p.Property<string>
    rounding: p.Property<RoundingFunction>
  }
}

export interface NumberFormatter extends NumberFormatter.Attrs {}

export class NumberFormatter extends StringFormatter {
  properties: NumberFormatter.Props

  constructor(attrs?: Partial<NumberFormatter.Attrs>) {
    super(attrs)
  }

  static init_NumberFormatter(): void {

    this.define<NumberFormatter.Props>({
      format:    [ p.String,           '0,0'   ], // TODO (bev)
      language:  [ p.String,           'en'    ], // TODO (bev)
      rounding:  [ p.RoundingFunction, 'round' ], // TODO (bev)
      nan_format: [ p.String ],
    })
  }

  doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const {format, language, nan_format} = this
    const rounding = (() => {
      switch (this.rounding) {
        case "round": case "nearest":   return Math.round
        case "floor": case "rounddown": return Math.floor
        case "ceil":  case "roundup":   return Math.ceil
      }
    })()
    if ((value == null || isNaN(value)) && nan_format != null)
      value = nan_format
    else
      value = Numbro.format(value, format, language, rounding)
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
  properties: BooleanFormatter.Props

  constructor(attrs?: Partial<BooleanFormatter.Attrs>) {
    super(attrs)
  }

  static init_BooleanFormatter(): void {

    this.define<BooleanFormatter.Props>({
      icon: [ p.String, 'check' ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    return !!value ? i({class: this.icon}).outerHTML : ""
  }
}

export namespace DateFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = StringFormatter.Props & {
    format: p.Property<string> // XXX: enum
    nan_format: p.Property<string>
  }
}

export interface DateFormatter extends DateFormatter.Attrs {}

export class DateFormatter extends StringFormatter {
  properties: DateFormatter.Props

  constructor(attrs?: Partial<DateFormatter.Attrs>) {
    super(attrs)
  }

  static init_DateFormatter(): void {

    this.define<DateFormatter.Props>({
      format: [ p.String, 'ISO-8601' ],
      nan_format: [ p.String ],
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

  doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const {nan_format} = this
    value = isString(value) ? parseInt(value, 10) : value
    let date: string
    if ((value == null || isNaN(value)) && nan_format != null)
      date = nan_format
    else
      date = value == null ? '' : tz(value, this.getFormat())
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
  properties: HTMLTemplateFormatter.Props

  constructor(attrs?: Partial<HTMLTemplateFormatter.Attrs>) {
    super(attrs)
  }

  static init_HTMLTemplateFormatter(): void {

    this.define<HTMLTemplateFormatter.Props>({
      template: [ p.String, '<%= value %>' ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, dataContext: any): string {
    const {template} = this
    if (value == null)
      return ""
    else {
      const compiled_template = _.template(template)
      const context = {...dataContext, value}
      return compiled_template(context)
    }
  }
}
