import type {TypedArray} from "../types"
import {assert} from "../util/assert"
import {entries} from "../util/object"
import type {Ref} from "../util/refs"
import {isPlainObject, isObject, isArray, isTypedArray, isBoolean, isNumber, isString, isSymbol} from "../util/types"
import {map} from "../util/iterator"
import {BYTE_ORDER} from "../util/platform"
import {Buffer, Base64Buffer} from "./buffer"
import type {BytesRep, TypedArrayRep} from "./reps"

export type SerializableType =
  | null
  | boolean
  | number
  | string
  | Date
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

class Serialized<T> {
  constructor(readonly value: T) {}

  to_json(): string {
    return JSON.stringify(this.value)
  }
}

export type Options = {
  references: Map<unknown, Ref>
  binary: boolean
  include_defaults: boolean
}

export class Serializer {
  private readonly _references: Map<unknown, Ref>

  readonly binary: boolean
  readonly include_defaults: boolean

  protected readonly _circular: WeakSet<object> = new WeakSet()

  constructor(options?: Partial<Options>) {
    this.binary = options?.binary ?? false
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

  to_serializable<T extends SerializableType>(obj: T): Serialized<SerializableOf<T>>
  to_serializable(obj: unknown): Serialized<unknown>

  to_serializable(obj: unknown): Serialized<unknown> {
    return new Serialized(this.encode(obj))
  }

  encode<T extends SerializableType>(obj: T): SerializableOf<T>
  encode(obj: unknown): unknown

  encode(obj: unknown): unknown {
    const ref = this.get_ref(obj)
    if (ref != null) {
      return ref
    }

    if (!isObject(obj)) {
      return this._encode(obj)
    } else {
      if (this._circular.has(obj)) {
        this.error("circular reference")
      }

      this._circular.add(obj)
      try {
        return this._encode(obj)
      } finally {
        this._circular.delete(obj)
      }
    }
  }

  protected _encode(obj: unknown): unknown {
    if (is_Serializable(obj)) {
      return obj[serialize](this)
    } else if (isArray(obj)) {
      const n = obj.length
      const result: unknown[] = new Array(n)
      for (let i = 0; i < n; i++) {
        const value = obj[i]
        result[i] = this.encode(value)
      }
      return result
    } else if (isTypedArray(obj)) {
      return this._encode_typed_array(obj)
    } else if (obj instanceof ArrayBuffer) {
      const data = this.binary ? new Buffer(obj) : new Base64Buffer(obj)
      return {type: "bytes", data}
    } else if (isPlainObject(obj)) {
      const items = entries(obj)
      if (items.length == 0) {
        return {type: "map"}
      } else {
        return {type: "map", entries: [...map(items, ([key, val]) => [this.encode(key), this.encode(val)])]}
      }
    } else if (obj === null || isBoolean(obj) || isString(obj)) {
      return obj
    } else if (isNumber(obj)) {
      if (isNaN(obj)) {
        return {type: "number", value: "nan"}
      } else if (!isFinite(obj)) {
        return {type: "number", value: `${obj < 0 ? "-" : "+"}inf`}
      } else {
        return obj
      }
    } else if (obj instanceof Date) {
      const iso = obj.toISOString()
      return {type: "date", iso}
    } else if (obj instanceof Set) {
      if (obj.size == 0) {
        return {type: "set"}
      } else {
        return {type: "set", entries: [...map(obj.values(), (val) => this.encode(val))]}
      }
    } else if (obj instanceof Map) {
      if (obj.size == 0) {
        return {type: "map"}
      } else {
        return {type: "map", entries: [...map(obj.entries(), ([key, val]) => [this.encode(key), this.encode(val)])]}
      }
    } else if (isSymbol(obj) && obj.description != null) {
      return {type: "symbol", name: obj.description}
    } else {
      throw new SerializationError(`${Object.prototype.toString.call(obj)} is not serializable`)
    }
  }

  encode_struct(struct: {[key: string]: unknown}): {[key: string]: unknown} {
    const result: {[key: string]: unknown} = {}
    for (const [key, val] of entries(struct)) {
      if (val !== undefined) {
        result[key] = this.encode(val)
      }
    }
    return result
  }

  error(message: string): never {
    throw new SerializationError(message)
  }

  protected _encode_typed_array(obj: TypedArray): TypedArrayRep {
    const array = this.encode(obj.buffer) as BytesRep

    const dtype = (() => {
      switch (obj.constructor) {
        case Uint8Array: return "uint8"
        case Int8Array: return "int8"
        case Uint16Array: return "uint16"
        case Int16Array: return "int16"
        case Uint32Array: return "uint32"
        case Int32Array: return "int32"
        // case BigUint64Array: return "uint64"
        // case BigInt64Array: return "int64"
        case Float32Array: return "float32"
        case Float64Array: return "float64"
        default:
          this.error(`can't serialize typed array of type '${obj[Symbol.toStringTag]}'`)
      }
    })()

    return {
      type: "typed_array",
      array,
      order: BYTE_ORDER,
      dtype,
    }
  }
}
