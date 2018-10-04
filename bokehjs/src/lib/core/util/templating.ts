import {sprintf} from "sprintf-js"
import * as Numbro from "numbro"
import tz = require("timezone")

import {Anything} from "../types"
import {escape} from "./string"
import {isNumber, isString, isArray, isTypedArray} from "./types"

import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {ImageIndex} from "../../models/glyphs/image"
import {CustomJSHover} from 'models/tools/inspectors/customjs_hover'

export type FormatterType = "numeral" | "printf" | "datetime"
export type FormatterSpec = CustomJSHover | FormatterType
export type Formatters = {[key: string]: FormatterSpec}
export type FormatterFunc = (value: any, format: string, special_vars: Vars) => string
export type Index = number | ImageIndex
export type Vars = {[key: string]: Anything}

export const DEFAULT_FORMATTERS = {
  numeral:  (value: any, format: string, _special_vars: Vars) => Numbro.format(value, format),
  datetime: (value: any, format: string, _special_vars: Vars) => tz(value, format),
  printf:   (value: any, format: string, _special_vars: Vars) => sprintf(format, value),
}

export function basic_formatter(value: any, _format: string, _special_vars: Vars): string {
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

export function get_formatter(name: string, raw_spec: string, format?: string, formatters?: Formatters): FormatterFunc {
  // no format, use default built in formatter
  if (format == null)
    return basic_formatter

  // format spec in the formatters dict, use that
  if (formatters != null && (name in formatters || raw_spec in formatters)) {

    // some day (Bokeh 2.0) we can get rid of the check for name, and just check the raw spec
    // keep it now for compatibility but do not demonstrate it anywhere
    const key: string = raw_spec in formatters ? raw_spec : name
    const formatter = formatters[key]

    if (isString(formatter)) {
      if (formatter in DEFAULT_FORMATTERS)
        return DEFAULT_FORMATTERS[formatter]
      else
        throw new Error(`Unknown tooltip field formatter type '${formatter}'`)
    }

    return function(value: any, format: string, special_vars: Vars) : string {
      return formatter.format(value, format, special_vars)
    }
  }

  // otherwise use "numeral" as default
  return DEFAULT_FORMATTERS["numeral"]

}

export function get_value(name: string, data_source: ColumnarDataSource, i: Index, special_vars: Vars) {

  if (name[0] == "$") {
    if (name.substring(1) in special_vars)
      return special_vars[name.substring(1)]
    else
      throw new Error(`Unknown special variable '${name}'`)
  }

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
    }

    // inspect flat array
    else
      return data[i.flat_index]

  }

  // inspect per-image scalar data
  else
    return data

}

export function replace_placeholders(str: string, data_source: ColumnarDataSource, i: Index, formatters?: Formatters, special_vars: Vars = {}): string {

  // this extracts the $x, @x, @{x} without any trailing {format}
  const raw_spec = str.replace(/(?:^|[^@])([@|\$](?:\w+|{[^{}]+}))(?:{[^{}]+})?/g, (_match, raw_spec, _format) => `${raw_spec}`)

  // this handles the special case @$name, replacing it with an @var corresponding to special_vars.name
  str = str.replace(/@\$name/g, (_match) => `@{${special_vars.name}}`)

  // this prepends special vars with "@", e.g "$x" becomes "@$x", so subsequent processing is simpler
  str = str.replace(/(^|[^\$])\$(\w+)/g, (_match, prefix, name) => `${prefix}@$${name}`)

  str = str.replace(/(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (_match, prefix, name, long_name, format) => {

    name = long_name != null ? long_name : name

    const value = get_value(name, data_source, i, special_vars)

    // missing value, return ???
    if (value == null)
      return `${prefix}${escape("???")}`

    // 'safe' format, return the value as-is
    if (format == 'safe')
     return `${prefix}${value}`

    // format and escape everything else
    const formatter = get_formatter(name, raw_spec, format, formatters)
    return `${prefix}${escape(formatter(value, format, special_vars))}`

  })

  return str

}
