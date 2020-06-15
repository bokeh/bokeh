import {isBoolean, isNumber, isString, isArray, isIterable, isPlainObject} from "./types"
import {PlainObject} from "../types"
import {entries} from "./object"

export const pretty = Symbol("pretty")

export interface Printable {
  [pretty](printer: Printer): string
}

function isPrintable<T>(obj: T): obj is T & Printable {
  return pretty in Object(obj)
}

export class Printer {
  to_string(obj: unknown): string {
    if (isPrintable(obj))
      return obj[pretty](this)
    else if (isBoolean(obj))
      return this.boolean(obj)
    else if (isNumber(obj))
      return this.number(obj)
    else if (isString(obj))
      return this.string(obj)
    else if (isArray(obj))
      return this.array(obj)
    else if (isIterable(obj))
      return this.iterable(obj)
    else if (isPlainObject(obj))
      return this.object(obj)
    else
      return `${obj}`
  }

  token(val: string): string {
    return val
  }

  boolean(val: boolean): string {
    return `${val}`
  }

  number(val: number): string {
    return `${val}`
  }

  string(val: string): string {
    return `"${val.replace(/'/g, "\\'")}"`
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
}

export function to_string(obj: unknown): string {
  const printer = new Printer()
  return printer.to_string(obj)
}
