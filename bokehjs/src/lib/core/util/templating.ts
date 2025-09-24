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
import {isArray, isNumber, isString, isTypedArray/*, isInteger, isPlainObject*/} from "./types"
import {to_string} from "./pretty"
import {escape} from "./string"
import {assert} from "./assert"

//import {Parser, Grammar} from "nearley"
//import grammar from "./pipes"

const {abs} = Math

export type FormatterSpec = CustomJSHover | BuiltinFormatter
export type Formatters = Dict<FormatterSpec>
export type FormatterFunc = (value: unknown, format: string, special_vars: Vars) => string
export type Index = number | ImageIndex
export type Vars = {[key: string]: unknown}

export const DEFAULT_FORMATTERS: {[key in BuiltinFormatter]: FormatterFunc} = {
  raw:      (value: unknown, _format: string, _special_vars: Vars) => to_string(value),
  basic:    (value: unknown,  format: string,  special_vars: Vars) => basic_formatter(value, format, special_vars),
  numeral:  (value: unknown,  format: string, _special_vars: Vars) => Numbro.format(value, format),
  datetime: (value: unknown,  format: string, _special_vars: Vars) => datetime(value, format),
  printf:   (value: unknown,  format: string, _special_vars: Vars) => sprintf(format, value),
}

export class Skip {}

/**
 * Format finite numbers as dates or return NaN.
 */
export function datetime(value: unknown, format?: string): string {
  if (isNumber(value) && isFinite(value)) {
    return tz(value, format)
  } else {
    return "NaN"
  }
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
  } else if (isString(value)) {
    return value // get strings for categorical types
  } else {
    // TODO to_string(value); currently ImageStack relies on the primitive representation of typed arrays
    return `${value}`
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

type PlaceholderType = "$" | "@" | "@$"

export function get_value(type: PlaceholderType, name: string, data_source: ColumnarDataSource, index: Index | null, vars: Vars) {
  switch (type) {
    case "$":  return _get_special_value(name, vars)
    case "@":  return _get_column_value(name, data_source, index)
    case "@$": return name == "name" && isString(vars.name) ? _get_column_value(vars.name, data_source, index) : null
  }
}

class HTML {
  constructor(public html: string) {}
}

const functions = {
  safe: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 0)
    if (value == null) {
      return MISSING
    } else if (isNumber(value) && isNaN(value)) {
      return "NaN"
    } else {
      return new HTML(`${value}`)
    }
  },
  /*
  fixed: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 1)
    const [digits] = args
    if (isNumber(value) && isInteger(digits)) {
      return value.toFixed(digits)
    } else {
      return value
    }
  },
  round: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 0)
    if (isNumber(value)) {
      return Math.round(value)
    } else {
      return value
    }
  },
  upper: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 0)
    if (isString(value)) {
      return value.toUpperCase()
    } else {
      return value
    }
  },
  lower: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 0)
    if (isString(value)) {
      return value.toLowerCase()
    } else {
      return value
    }
  },
  filter: (value: unknown, ...args: unknown[]) => {
    assert(args.length == 1)
    const [expr] = args
    if (isPlainObject(expr) && "lit" in expr) {
      if (expr.lit == "finite") {
        if (!isNumber(value) || !isFinite(value)) {
          throw new Skip()
        }
      }
    }
    return value
  },
  */
}

export function replace_placeholders_html(input: string, data_source: ColumnarDataSource,
    index: Index | null, formatters?: Formatters, special_vars: Vars = {}): Node[] {

  const html = process_placeholders(input, (type, name, format, _, spec) => {
    const value = get_value(type, name, data_source, index, special_vars)

    /*
    type Lit = {lit: string}
    type Fn = {name: Lit, args: unknown[]}

    const parse = (input: string): Fn[] | null => {
      let parser: Parser
      try {
        parser = new Parser(Grammar.fromCompiled(grammar))
        parser.feed(input)
        const [pipeline] = parser.results
        return pipeline as Fn[]
      } catch (error) {
        return null
      }
    }

    const pipeline = parse(format ?? "")
    if (pipeline != null) {
      let result: unknown = value
      for (const fn of pipeline) {
        const name = fn.name.lit
        if (name in functions) {
          result = functions[name as keyof typeof functions](result, ...fn.args)
        } else {
          console.error(`unknown function '${fn.name}'`)
          break
        }
      }
      if (result instanceof HTML) {
        return result.html
      } else {
        return escape(`${result}`)
      }
    */

    if (format == "safe") {
      const result = functions.safe(value)
      if (result instanceof HTML) {
        return result.html
      } else {
        return escape(`${result}`)
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
      return escape(result)
    }
  })

  const html_parser = new DOMParser()
  const document = html_parser.parseFromString(html, "text/html")
  return [...document.body.childNodes]
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
const regex = /(@\$|@|\$)((?:[\p{Letter}\p{Number}_]+)|(?:\{(?:[^{}]+)\}))(?:\{([^{}]+)\})?/gu

export type PlaceholderReplacer = (type: PlaceholderType, name: string, format: string | undefined, i: number, spec: string) => string | null | undefined

export function process_placeholders(text: string, fn: PlaceholderReplacer): string {
  let i = 0 // this var is used for testing purposes
  return text.replace(regex, (_match: string, type: PlaceholderType, content: string, format: string | undefined) => {
    const name = content.replace(/^{/, "").replace(/}$/, "").trim()
    const spec = `${type}${content}`
    return fn(type, name, format, i++, spec) ?? MISSING
  })
}
