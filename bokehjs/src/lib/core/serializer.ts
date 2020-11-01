import {assert} from "./util/assert"
import {entries} from "./util/object"
import {Ref, Struct} from "./util/refs"
import {isPlainObject, isArray, isTypedArray, isBoolean, isNumber, isString} from "./util/types"

export type SerializableType =
  | null
  | boolean
  | number
  | string
  | Serializable
  | SerializableType[]
  | {[key: string]: SerializableType}
  //| Map<SerializableType, SerializableType>
  //| Set<SerializableType>
  //| ArrayBuffer
  // TypedArray?

export const serialize = Symbol("serialize")

export interface Serializable {
  [serialize](serializer: Serializer): unknown
}

function is_Serializable<T>(obj: T): obj is T & Serializable {
  return serialize in Object(obj)
}

export type SerializableOf<T extends SerializableType> =
  T extends Serializable       ? ReturnType<T[typeof serialize]> :
  T extends SerializableType[] ? SerializableOf<T[number]>[]     : unknown

export class SerializationError extends Error {}

export class Serializer {
  private readonly _references: Map<unknown, Ref> = new Map()
  private readonly _definitions: Map<unknown, Struct> = new Map()

  readonly include_defaults: boolean

  constructor(options?: {include_defaults?: boolean}) {
    this.include_defaults = options?.include_defaults ?? true
  }

  add_ref(obj: unknown, ref: Ref): void {
    this._references.set(obj, ref)
  }

  add_def(obj: unknown, def: Struct): void {
    assert(this._references.has(obj))
    this._definitions.set(obj, def)
  }

  get objects(): Set<unknown> {
    return new Set(this._references.keys())
  }

  get references(): Set<Ref> {
    return new Set(this._references.values())
  }

  get definitions(): Set<Struct> {
    return new Set(this._definitions.values())
  }

  remove_ref(obj: unknown): boolean {
    return this._references.delete(obj)
  }

  remove_def(obj: unknown): boolean {
    return this._definitions.delete(obj)
  }

  to_serializable<T extends SerializableType>(obj: T): SerializableOf<T>
  to_serializable(obj: unknown): unknown

  to_serializable(obj: unknown): unknown {
    if (is_Serializable(obj))
      return obj[serialize](this)
    else if (isArray(obj) || isTypedArray(obj)) {
      const n = obj.length
      const result: unknown[] = new Array(n)
      for (let i = 0; i < n; i++) {
        const value = obj[i]
        result[i] = this.to_serializable(value)
      }
      return result
    } else if (isPlainObject(obj)) {
      const result: {[key: string]: unknown} = {}
      for (const [key, value] of entries(obj)) {
        result[key] = this.to_serializable(value)
      }
      return result
    } else if (obj === null || isBoolean(obj) || isNumber(obj) || isString(obj)) {
      return obj
    } else
      throw new SerializationError(`${Object.prototype.toString.call(obj)} is not serializable`)
  }
}
