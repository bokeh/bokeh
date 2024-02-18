import {settings} from "../settings"

export function uuid4(): string {
  // from ipython project
  // http://www.ietf.org/rfc/rfc4122.txt
  const s = new Array<string>(32)
  const hex_digits = "0123456789ABCDEF"
  for (let i = 0; i < 32; i++) {
    s[i] = hex_digits[Math.floor(Math.random() * 0x10)]
  }
  s[12] = "4"                                           // bits 12-15 of the time_hi_and_version field to 0010
  s[16] = hex_digits[(s[16].charCodeAt(0) & 0x3) | 0x8] // bits 6-7 of the clock_seq_hi_and_reserved to 01
  return s.join("")
}

let counter = 1000

export function unique_id(prefix?: string): string {
  const id = settings.dev ? `j${counter++}` : uuid4()

  if (prefix != null) {
    return `${prefix}-${id}`
  } else {
    return id
  }
}

export function escape(s: string): string {
  return s.replace(/(?:[&<>"'`])/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      case "'": return "&#x27;"
      case "`": return "&#x60;"
      default:  return ch
    }
  })
}

export function unescape(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#x27|#x60);/g, (_, entity) => {
    switch (entity) {
      case "amp":  return "&"
      case "lt":   return "<"
      case "gt":   return ">"
      case "quot": return '"'
      case "#x27": return "'"
      case "#x60": return "`"
      default:     return entity
    }
  })
}

export function use_strict(code: string): string {
  return `'use strict';\n${code}`
}

export function to_fixed(val: number, precision?: number): string {
  return val.toFixed(precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
}

export function insert_text_on_position(destination: string, position: number, text_to_be_inserted: string) {
  const result_text = []
  result_text.push(destination.slice(0, position))
  result_text.push(text_to_be_inserted)
  result_text.push(destination.slice(position))
  return result_text.join("")
}
