import {isBoolean, isNumber, isString, isSymbol, isArray, isIterable, isObject, isPlainObject} from "./types"
import type {PlainObject} from "../types"
import {entries} from "./object"

export const pretty = Symbol("pretty")

export interface Printable {
  [pretty](printer: Printer): string
}

function is_Printable<T>(obj: T): obj is T & Printable {
  return isObject(obj) && pretty in obj
}

export type PrinterOptions = {
  precision?: number
}

export class Printer {
  readonly precision?: number
  protected readonly visited: Set<object> = new Set()

  constructor(options?: PrinterOptions) {
    this.precision = options?.precision
  }

  to_string(obj: unknown): string {
    if (isObject(obj)) {
      if (this.visited.has(obj)) {
        return "<circular>"
      } else {
        this.visited.add(obj)
      }
    }

    if (is_Printable(obj)) {
      return obj[pretty](this)
    } else if (isBoolean(obj)) {
      return this.boolean(obj)
    } else if (isNumber(obj)) {
      return this.number(obj)
    } else if (isString(obj)) {
      return this.string(obj)
    } else if (isArray(obj)) {
      return this.array(obj)
    } else if (isIterable(obj)) {
      return this.iterable(obj)
    } else if (isPlainObject(obj)) {
      return this.object(obj)
    } else if (isSymbol(obj)) {
      return this.symbol(obj)
    } else if (obj instanceof ArrayBuffer) {
      return this.array_buffer(obj)
    } else {
      return `${obj}`
    }
  }

  token(val: string): string {
    return val
  }

  boolean(val: boolean): string {
    return `${val}`
  }

  number(val: number): string {
    if (this.precision != null) {
      return val.toFixed(this.precision)
    } else {
      return `${val}`
    }
  }

  string(val: string): string {
    const sq = val.includes("'")
    const dq = val.includes('"')

    if (sq && dq) {
      return `\`${val.replace(/`/g, "\\`")}\``
    } else if (dq) {
      return `'${val}'`
    } else {
      return `"${val}"`
    }
  }

  symbol(val: symbol): string {
    return val.toString()
  }

  array(obj: Iterable<unknown>): string {
    const T = this.token
    const items = []
    for (const entry of obj) {
      items.push(this.to_string(entry))
    }
    return `${T("[")}${items.join(`${T(",")} `)}${T("]")}`
  }

  iterable(obj: Iterable<unknown>): string {
    const T = this.token
    const tag = Object(obj)[Symbol.toStringTag] ?? "Object"
    const items = this.array(obj)
    return `${tag}${T("(")}${items}${T(")")}`
  }

  object(obj: PlainObject): string {
    const T = this.token
    const items = []
    for (const [key, val] of entries(obj)) {
      items.push(`${key}${T(":")} ${this.to_string(val)}`)
    }
    return `${T("{")}${items.join(`${T(",")} `)}${T("}")}`
  }

  array_buffer(obj: ArrayBuffer): string {
    return `ArrayBuffer(#${obj.byteLength})`
  }
}

export function to_string(obj: unknown, options?: PrinterOptions): string {
  const printer = new Printer(options)
  return printer.to_string(obj)
}
