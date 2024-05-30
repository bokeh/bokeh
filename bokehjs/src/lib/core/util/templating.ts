import * as Numbro from "@bokeh/numbro"
import type {ImageIndex} from "models/selections/selection"
import type {ColumnarDataSource} from "models/sources/columnar_data_source"
import type {CustomJSHover} from "models/tools/inspectors/customjs_hover"
import {sprintf as sprintf_js} from "sprintf-js"
import tz from "timezone"
import type {Dict} from "../types"
import type {BuiltinFormatter} from "../enums"
import {logger} from "../logging"
import {dict} from "./object"
import {is_NDArray} from "./ndarray"
import {isArray, isNumber, isString, isTypedArray} from "./types"

const {abs} = Math

export type FormatterSpec = CustomJSHover | BuiltinFormatter
export type Formatters = Dict<FormatterSpec>
export type FormatterFunc = (value: unknown, format: string, special_vars: Vars) => string
export type Index = number | ImageIndex
export type Vars = {[key: string]: unknown}

export const DEFAULT_FORMATTERS: {[key in BuiltinFormatter]: FormatterFunc} = {
  raw:      (value: unknown, _format: string, _special_vars: Vars) => `${value}`,
  basic:    (value: unknown,  format: string,  special_vars: Vars) => basic_formatter(value, format, special_vars),
  numeral:  (value: unknown,  format: string, _special_vars: Vars) => Numbro.format(value, format),
  datetime: (value: unknown,  format: string, _special_vars: Vars) => tz(value, format),
  printf:   (value: unknown,  format: string, _special_vars: Vars) => sprintf(format, value),
}

export function sprintf(format: string, ...args: unknown[]): string {
  return sprintf_js(format, ...args)
}

export function basic_formatter(value: unknown, _format: string, _special_vars: Vars): string {
  if (isNumber(value)) {
    const format = (() => {
      if (Number.isInteger(value)) {
        return "%d"
      } else if (0.1 < abs(value) && abs(value) < 1000) {
        return "%0.3f"
      } else {
        return "%0.3e"
      }
    })()

    return sprintf(format, value)
  } else {
    return `${value}` // get strings for categorical types
  }
}

export function get_formatter(spec: string, format?: string, formatters?: Formatters): FormatterFunc {
  // no format, use default built in formatter
  if (format == null) {
    return DEFAULT_FORMATTERS.basic
  }

  // format spec in the formatters dict, use that
  if (formatters != null) {
    const formatter = dict(formatters).get(spec)
    if (formatter != null) {
      if (isString(formatter)) {
        if (formatter in DEFAULT_FORMATTERS) {
          return DEFAULT_FORMATTERS[formatter]
        } else {
          throw new Error(`Unknown tooltip field formatter type '${formatter}'`)
        }
      }

      return function(value: unknown, format: string, special_vars: Vars): string {
        return formatter.format(value, format, special_vars)
      }
    }
  }

  // otherwise use "numeral" as default
  return DEFAULT_FORMATTERS.numeral
}

export const MISSING = "???"

function _get_special_value(name: string, special_vars: Vars) {
  if (name in special_vars) {
    return special_vars[name]
  } else {
    logger.warn(`unknown special variable '\$${name}'`)
    return MISSING
  }
}

export function _get_column_value(name: string, data_source: ColumnarDataSource, ind: Index | null): unknown | null {
  const column = data_source.get_column(name)

  // missing column
  if (column == null) {
    return null
  }

  // null index (e.g for patch)
  if (ind == null) {
    return null
  }

  // typical (non-image) index
  if (isNumber(ind)) {
    return column[ind]
  }

  // image index
  const data = column[ind.index]
  if (isTypedArray(data) || isArray(data)) {
    // inspect array of arrays
    if (isArray(data[0])) {
      const row: any = data[ind.j]
      return row[ind.i]
    } else if (is_NDArray(data) && data.dimension == 3) {
      // For 3d array return whole of 3rd axis
      return data.slice(ind.flat_index*data.shape[2], (ind.flat_index + 1)*data.shape[2])
    } else {
      // inspect flat array
      return data[ind.flat_index]
    }
  } else {
    // inspect per-image scalar data
    return data
  }
}

type PlaceholderType = "$" | "@"

export function get_value(type: PlaceholderType, name: string, data_source: ColumnarDataSource, i: Index | null, special_vars: Vars) {
  switch (type) {
    case "$": return _get_special_value(name, special_vars)
    case "@": return _get_column_value(name, data_source, i)
  }
}

export function replace_placeholders(content: string | {html: string}, data_source: ColumnarDataSource,
    i: Index | null, formatters?: Formatters, special_vars: Vars = {}, encode?: (v: string) => string): string | Node[]  {
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

  str = process_placeholders(str, (type, name, format, _, spec) => {
    const value = get_value(type, name, data_source, i, special_vars)

    // 'safe' format, return the value as-is
    if (format == "safe") {
      has_html = true
      if (value == null) {
        return MISSING
      } else if (isNumber(value) && isNaN(value)) {
        return "NaN"
      } else {
        return `${value}`
      }
    } else {
      const result = (() => {
        if (value == null) {
          return MISSING
        } else if (isNumber(value) && isNaN(value)) {
          return "NaN"
        } else {
          const formatter = get_formatter(spec, format, formatters)
          return `${formatter(value, format ?? "", special_vars)}`
        }
      })()
      return encode != null ? encode(result) : result
    }
  })

  if (!has_html) {
    return str
  } else {
    const parser = new DOMParser()
    const document = parser.parseFromString(str, "text/html")
    return [...document.body.childNodes]
  }
}

/**
 * This supports the following:
 *
 * - simple vars: $x
 * - simple names: @x, @słowa_0, @Wörter (@ symbol followed by unicode letters, numbers or underscore)
 * - full vars: ${one two}
 * - full names: @{one two} (@{anything except curly brackets}
 * - optional formatting: $x{format}, ${x}{format}, @x{format}, @{one two}{format}
 */
const regex = /((?:[$@][\p{Letter}\p{Number}_]+)|(?:[$@]\{(?:[^{}]+)\}))(?:\{([^{}]+)\})?/gu

type PlaceholderReplacer = (type: PlaceholderType, name: string, format: string | undefined, i: number, spec: string) => string | null | undefined

export function process_placeholders(text: string, fn: PlaceholderReplacer): string {
  let i = 0
  return text.replace(regex, (_match, spec: string, format: string | undefined) => {
    const type = spec[0] as "@" | "$"
    const name = spec.substring(1).replace(/^{/, "").replace(/}$/, "").trim()
    return fn(type, name, format, i++, spec) ?? MISSING
  })
}
