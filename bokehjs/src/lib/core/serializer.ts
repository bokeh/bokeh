import {assert} from "./util/assert"
import {entries} from "./util/object"
import {Ref} from "./util/refs"
import {/*isBasicObject, */isPlainObject, isObject, isArray, isTypedArray, isBoolean, isNumber, isString, isSymbol} from "./util/types"
import {encode_bytes} from "./util/serialization"
import {map} from "./util/iterator"

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
  | ArrayBuffer
  // TypedArray?

export const serialize = Symbol("serialize")

export interface Serializable {
  [serialize](serializer: Serializer): unknown
}

function is_Serializable<T>(obj: T): obj is T & Serializable {
  return isObject(obj) && serialize in obj
}

export type SerializableOf<T extends SerializableType> =
  T extends Serializable       ? ReturnType<T[typeof serialize]> :
  T extends SerializableType[] ? SerializableOf<T[number]>[]     : unknown

export class SerializationError extends Error {}

export type Options = {
  references: Map<unknown, Ref>
  include_defaults: boolean
}

export class Serializer {
  private readonly _references: Map<unknown, Ref>

  readonly include_defaults: boolean

  constructor(options?: Partial<Options>) {
    this.include_defaults = options?.include_defaults ?? false

    const references = options?.references
    this._references = references != null ? new Map(references) : new Map()
  }

  get_ref(obj: unknown): Ref | undefined {
    return this._references.get(obj)
  }

  add_ref(obj: unknown, ref: Ref): void {
    assert(!this._references.has(obj))
    this._references.set(obj, ref)
  }

  to_serializable<T extends SerializableType>(obj: T): SerializableOf<T>
  to_serializable(obj: unknown): unknown

  to_serializable(obj: unknown): unknown {
    return this.encode(obj)
  }

  encode<T extends SerializableType>(obj: T): SerializableOf<T>
  encode(obj: unknown): unknown

  encode(obj: unknown): unknown {
    const ref = this.get_ref(obj)
    if (ref != null)
      return ref
    else if (is_Serializable(obj))
      return obj[serialize](this)
    else if (isArray(obj) || isTypedArray(obj)) { // ???: typed arrays
      const n = obj.length
      const result: unknown[] = new Array(n)
      for (let i = 0; i < n; i++) {
        const value = obj[i]
        result[i] = this.encode(value)
      }
      return result
    } else if (obj instanceof ArrayBuffer) {
      return encode_bytes(obj)
    } else if (isPlainObject(obj)) {
      return {type: "map", entries: [...map(entries(obj), ([key, val]) => [this.encode(key), this.encode(val)])]}
    /*
    } else if (isBasicObject(obj)) {
      return {type: "map", entries: [...map(entries(obj), ([key, val]) => [this.encode(key), this.encode(val)])]}
    } else if (isPlainObject(obj)) {
      const result: {[key: string]: unknown} = {}
      for (const [key, value] of entries(obj)) {
        result[key] = this.encode(value)
      }
      return result
    */
    } else if (obj === null || isBoolean(obj) || isString(obj)) {
      return obj
    } else if (isNumber(obj)) {
      if (isNaN(obj))
        return {type: "number", value: "nan"}
      else if (!isFinite(obj))
        return {type: "number", value: `${obj < 0 ? "-" : "+"}inf`}
      else
        return obj
    } else if (obj instanceof Set) {
      return {type: "set", entries: [...map(obj.values(), (val) => this.encode(val))]}
    } else if (obj instanceof Map) {
      return {type: "map", entries: [...map(obj.entries(), ([key, val]) => [this.encode(key), this.encode(val)])]}
    } else if (isSymbol(obj) && obj.description != null) {
      return {type: "symbol", name: obj.description}
    } else
      throw new SerializationError(`${Object.prototype.toString.call(obj)} is not serializable`)
  }
}
