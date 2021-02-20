import {entries} from "./object"
import {isPlainObject, isObject, isArray, isBoolean, isNumber, isString} from "./types"

export type CloneableType =
  | null
  | boolean
  | number
  | string
  | Cloneable
  | CloneableType[]
  | {[key: string]: CloneableType}
  //| Map<CloneableType, CloneableType>
  //| Set<CloneableType>

export const clone = Symbol("clone")

export interface Cloneable {
  [clone](cloner: Cloner): this
}

export function is_Cloneable<T>(obj: T): obj is T & Cloneable {
  return isObject(obj) && clone in obj
}

export class CloningError extends Error {}

export class Cloner {
  constructor() {}

  clone<T extends CloneableType>(obj: T): T
  clone(obj: unknown): unknown

  clone(obj: unknown): unknown {
    if (is_Cloneable(obj))
      return obj[clone](this)
    else if (isArray(obj)) {
      const n = obj.length
      const result: unknown[] = new Array(n)
      for (let i = 0; i < n; i++) {
        const value = obj[i]
        result[i] = this.clone(value)
      }
      return result
    } else if (isPlainObject(obj)) {
      const result: {[key: string]: unknown} = {}
      for (const [key, value] of entries(obj)) {
        result[key] = this.clone(value)
      }
      return result
    } else if (obj === null || isBoolean(obj) || isNumber(obj) || isString(obj)) {
      return obj
    } else
      throw new CloningError(`${Object.prototype.toString.call(obj)} is not cloneable`)
  }
}
