import {sprintf} from "sprintf-js"
import * as Numbro from "numbro"
import tz = require("timezone")

import {escape} from "./string"
import {isNumber, isArray, isTypedArray} from "./types"

import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {ImageIndex} from "../../models/glyphs/image"


function _format_number(num: string | number): string {
  if (isNumber(num)) {
    const format = (() => {
      switch (false) {
        case Math.floor(num) != num:
          return "%d"
        case !(Math.abs(num) > 0.1) || !(Math.abs(num) < 1000):
          return "%0.3f"
        default:
          return "%0.3e"
      }
    })()

    return sprintf(format, num)
  } else
    return `${num}`  // get strings for categorical types
}


export function replace_placeholders(str: string, data_source: ColumnarDataSource, i : number | ImageIndex,
    formatters: {[key: string]: "numeral" | "printf" | "datetime"} | null = null, special_vars: {[key: string]: any} = {}): string {

  str = str.replace(/(^|[^\$])\$(\w+)/g, (_match, prefix, name) => `${prefix}@$${name}`)

  str = str.replace(/(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (_match, prefix, name, long_name, format) => {
    name = long_name != null ? long_name : name

    let value: any
    if (name[0] == "$")
      value = special_vars[name.substring(1)]

    const column = data_source.get_column(name)

    if (!isNumber(i)) { // An ImageIndex
      if (column != null) {
        const data = column[i['index']]
        if (isTypedArray(data) || isArray(data)) {
          if (isArray(data[0])) { // Array of arrays format
            let row : any
            row = data[i['dim2']]
            value = row[i['dim1']]
          }
          else {
            value = data[i['flat_index']]
          }
        }
        else {
          value = data
        }
      }
    }
    else {
      if (column != null)
        value = column[i]
    }

    let replacement = null
    if (value == null)
      replacement = "???"
    else {
      // 'safe' format, just return the value as is
      if (format == 'safe')
        return `${prefix}${value}`
      else if (format != null) {
        // see if the field has an entry in the formatters dict
        if (formatters != null && name in formatters) {
          const formatter = formatters[name]
          switch (formatter) {
            case "numeral":
              replacement = Numbro.format(value, format)
              break
            case "datetime":
              replacement = tz(value, format)
              break
            case "printf":
              replacement = sprintf(format, value)
              break
            default:
              throw new Error(`Unknown tooltip field formatter type '${formatter}'`)
          }
        // if not assume the format string is Numbro
        } else
          replacement = Numbro.format(value, format)
      // no format supplied, just use a basic default numeric format
      } else
        replacement = _format_number(value)
    }

    return `${prefix}${escape(replacement)}`
  })

  return str
}
