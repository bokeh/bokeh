import * as Numbro from "numbro"
import compile_template = require("underscore.template")
import tz = require("timezone")

import * as p from "core/properties"
import {span, i} from "core/dom"
import {Color} from "core/types"
import {FontStyle, TextAlign, RoundingFunction} from "core/enums"
import {isString} from "core/util/types"
import {Model} from "../../../model"

export namespace CellFormatter {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
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
  export interface Attrs extends CellFormatter.Attrs {
    font_style: FontStyle
    text_align: TextAlign
    text_color: Color
  }

  export interface Props extends CellFormatter.Props {}
}

export interface StringFormatter extends StringFormatter.Attrs {}

export class StringFormatter extends CellFormatter {
  properties: StringFormatter.Props

  constructor(attrs?: Partial<StringFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'StringFormatter'

    this.define({
      font_style: [ p.FontStyle, "normal" ],
      text_align: [ p.TextAlign, "left"   ],
      text_color: [ p.Color ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    const {font_style, text_align, text_color} = this

    const text = span({}, value == null ? "" : `${value}`)
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
StringFormatter.initClass()

export namespace NumberFormatter {
  export interface Attrs extends StringFormatter.Attrs {
    format: string
    language: string
    rounding: RoundingFunction
  }

  export interface Props extends StringFormatter.Props {}
}

export interface NumberFormatter extends NumberFormatter.Attrs {}

export class NumberFormatter extends StringFormatter {
  properties: NumberFormatter.Props

  constructor(attrs?: Partial<NumberFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'NumberFormatter'

    this.define({
      format:     [ p.String, '0,0'       ], // TODO (bev)
      language:   [ p.String, 'en'        ], // TODO (bev)
      rounding:   [ p.String, 'round'     ], // TODO (bev)
    })
  }

  doFormat(row: any, cell: any, value: any, columnDef: any, dataContext: any): string {
    const {format, language} = this
    const rounding = (() => { switch (this.rounding) {
      case "round": case "nearest":   return Math.round
      case "floor": case "rounddown": return Math.floor
      case "ceil":  case "roundup":   return Math.ceil
    } })()
    value = Numbro.format(value, format, language, rounding)
    return super.doFormat(row, cell, value, columnDef, dataContext)
  }
}
NumberFormatter.initClass()

export namespace BooleanFormatter {
  export interface Attrs extends CellFormatter.Attrs {
    icon: string // XXX: enum
  }

  export interface Props extends CellFormatter.Props {}
}

export interface BooleanFormatter extends BooleanFormatter.Attrs {}

export class BooleanFormatter extends CellFormatter {
  properties: BooleanFormatter.Props

  constructor(attrs?: Partial<BooleanFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'BooleanFormatter'

    this.define({
      icon: [ p.String, 'check' ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, _dataContext: any): string {
    return !!value ? i({class: this.icon}).outerHTML : ""
  }
}
BooleanFormatter.initClass()

export namespace DateFormatter {
  export interface Attrs extends CellFormatter.Attrs {
    format: string // XXX: enum
  }

  export interface Props extends CellFormatter.Props {}
}

export interface DateFormatter extends DateFormatter.Attrs {}

export class DateFormatter extends CellFormatter {
  properties: DateFormatter.Props

  constructor(attrs?: Partial<DateFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'DateFormatter'

    this.define({
      format: [ p.String, 'ISO-8601' ],
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
    value = isString(value) ? parseInt(value, 10) : value
    const date = tz(value, this.getFormat())
    return super.doFormat(row, cell, date, columnDef, dataContext)
  }
}
DateFormatter.initClass()

export namespace HTMLTemplateFormatter {
  export interface Attrs extends CellFormatter.Attrs {
    template: string
  }

  export interface Props extends CellFormatter.Props {}
}

export interface HTMLTemplateFormatter extends HTMLTemplateFormatter.Attrs {}

export class HTMLTemplateFormatter extends CellFormatter {
  properties: HTMLTemplateFormatter.Props

  constructor(attrs?: Partial<HTMLTemplateFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'HTMLTemplateFormatter'

    this.define({
      template: [ p.String, '<%= value %>' ],
    })
  }

  doFormat(_row: any, _cell: any, value: any, _columnDef: any, dataContext: any): string {
    const {template} = this
    if (value == null)
      return ""
    else {
      const compiled_template = compile_template(template)
      const context = {...dataContext, value}
      return compiled_template(context)
    }
  }
}
HTMLTemplateFormatter.initClass()
