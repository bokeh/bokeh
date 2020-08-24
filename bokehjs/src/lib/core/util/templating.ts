import * as Numbro from "@bokeh/numbro"
import {sprintf as sprintf_js} from "sprintf-js"
import tz from "timezone"

import {escape} from "./string"
import {isNumber, isString, isArray, isTypedArray} from "./types"

import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {CustomJSHover} from 'models/tools/inspectors/customjs_hover'
import {ImageIndex} from "models/selections/selection"

export type FormatterType = "numeral" | "printf" | "datetime"
export type FormatterSpec = CustomJSHover | FormatterType
export type Formatters = {[key: string]: FormatterSpec}
export type FormatterFunc = (value: unknown, format: string, special_vars: Vars) => string
export type Index = number | ImageIndex
export type Vars = {[key: string]: unknown}

export const DEFAULT_FORMATTERS = {
  numeral:  (value: string | number, format: string, _special_vars: Vars) => Numbro.format(value, format),
  datetime: (value: unknown, format: string, _special_vars: Vars) => tz(value, format),
  printf:   (value: unknown, format: string, _special_vars: Vars) => sprintf(format, value),
}

export function sprintf(format: string, ...args: unknown[]): string {
  return sprintf_js(format, ...args)
}

export function basic_formatter(value: unknown, _format: string, _special_vars: Vars): string {
  if (isNumber(value)) {
    const format = (() => {
      switch (false) {
        case Math.floor(value) != value:
          return "%d"
        case !(Math.abs(value) > 0.1) || !(Math.abs(value) < 1000):
          return "%0.3f"
        default:
          return "%0.3e"
      }
    })()

    return sprintf(format, value)
  } else
    return `${value}`  // get strings for categorical types
}

export function get_formatter(raw_spec: string, format?: string, formatters?: Formatters): FormatterFunc {
  // no format, use default built in formatter
  if (format == null)
    return basic_formatter

  // format spec in the formatters dict, use that
  if (formatters != null && raw_spec in formatters) {

    const formatter = formatters[raw_spec]

    if (isString(formatter)) {
      if (formatter in DEFAULT_FORMATTERS)
        return DEFAULT_FORMATTERS[formatter]
      else
        throw new Error(`Unknown tooltip field formatter type '${formatter}'`)
    }

    return function(value: unknown, format: string, special_vars: Vars): string {
      return formatter.format(value, format, special_vars)
    }
  }

  // otherwise use "numeral" as default
  return DEFAULT_FORMATTERS.numeral
}

function  _get_special_value(name: string, special_vars: Vars) {
  if (name in special_vars)
    return special_vars[name]
  else
    throw new Error(`Unknown special variable '\$${name}'`)
}

function  _get_column_value(name: string, data_source: ColumnarDataSource, i: Index) {
  const column = data_source.get_column(name)

  // missing column
  if (column == null)
    return null

  // typical (non-image) index
  if (isNumber(i))
    return column[i]

  // image index
  const data = column[i.index]
  if (isTypedArray(data) || isArray(data)) {

    // inspect array of arrays
    if (isArray(data[0])) {
      const row: any = data[i.dim2]
      return row[i.dim1]
    } else
      return data[i.flat_index] // inspect flat array
  } else
    return data // inspect per-image scalar data
}

export function get_value(raw_name: string, data_source: ColumnarDataSource, i: Index, special_vars: Vars) {

  if (raw_name[0] == "$") {
    const name = raw_name.substring(1)
    return _get_special_value(name, special_vars)
  } else {
    const name = raw_name.substring(1).replace(/[{}]/g, "")
    return _get_column_value(name, data_source, i)
  }
}

export function replace_placeholders(content: string | {html: string}, data_source: ColumnarDataSource, i: Index, formatters?: Formatters, special_vars: Vars = {}): string | Node[]  {
  let str: string
  let has_html: boolean

  if (isString(content)) {
    str = content
    has_html = false
  } else {
    str = content.html
    has_html = true
  }

  // this handles the special case @$name, replacing it with an @var corresponding to special_vars.name
  str = str.replace(/@\$name/g, (_match) => `@{${special_vars.name}}`)

  //
  // (?:\$\w+) - special vars: $x
  // (?:@\w+) - simple names: @foo
  // (?:@{(?:[^{}]+)})) - full names: @{one two}
  //
  // (?:{([^{}]+)})? - (optional) format for all of the above: @foo{fmt}
  //
  str = str.replace(/((?:\$\w+)|(?:@\w+)|(?:@{(?:[^{}]+)}))(?:{([^{}]+)})?/g, (_match, spec, format) => {
    const value = get_value(spec, data_source, i, special_vars)

    // missing value, return ???
    if (value == null)
      return `${escape("???")}`

    // 'safe' format, return the value as-is
    if (format == 'safe') {
      has_html = true
      return `${value}`
    }

    // format and escape everything else
    const formatter = get_formatter(spec, format, formatters)
    return `${escape(formatter(value, format, special_vars))}`
  })

  if (!has_html)
    return str
  else {
    const parser = new DOMParser()
    const document = parser.parseFromString(str, "text/html")
    return [...document.body.childNodes]
  }
}
