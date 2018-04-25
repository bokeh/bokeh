import {sprintf} from "sprintf-js"
import * as Numbro from "numbro"
import tz = require("timezone")

import {escape} from "./string"
import {isNumber} from "./types"

import {ColumnarDataSource} from "models/sources/columnar_data_source"

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


export function replace_placeholders(str: string, data_source: ColumnarDataSource, i : any,
    formatters: {[key: string]: "numeral" | "printf" | "datetime"} | null = null, special_vars: {[key: string]: any} = {}): string {

  str = str.replace(/(^|[^\$])\$(\w+)/g, (_match, prefix, name) => `${prefix}@$${name}`)

  str = str.replace(/(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (_match, prefix, name, long_name, format) => {
    name = long_name != null ? long_name : name

    let value: any
    if (name[0] == "$")
      value = special_vars[name.substring(1)]
    else {
      const column = data_source.get_column(name)
      const [ind, dim1, dim2, linind] = Array.isArray(i) ? i : [i, null, null, null]
      if ((data_source._shapes[name] != undefined) && (column != null)) {
        if (ArrayBuffer.isView(column[ind])) { // Typed arrays use the linear index
          value = column[ind][linind]
        }
        else {
          value = column[ind][dim2][dim1]
        }
      }
      else if (column != null) {
        value = column[ind]
      }
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
