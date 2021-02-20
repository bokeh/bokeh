import {assert} from "./util/assert"
import {entries} from "./util/object"
import {Ref, Struct} from "./util/refs"
import {isPlainObject, isObject, isArray, isTypedArray, isBoolean, isNumber, isString} from "./util/types"

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
  return isObject(obj) && serialize in obj
}

export type SerializableOf<T extends SerializableType> =
  T extends Serializable       ? ReturnType<T[typeof serialize]> :
  T extends SerializableType[] ? SerializableOf<T[number]>[]     : unknown

export class SerializationError extends Error {}

export class Serializer {
  private readonly _references: Map<unknown, Ref> = new Map()
  private readonly _definitions: Map<unknown, Struct> = new Map()
  private readonly _refmap: Map<Ref, Struct> = new Map()

  readonly include_defaults: boolean

  constructor(options?: {include_defaults?: boolean}) {
    this.include_defaults = options?.include_defaults ?? true
  }

  get_ref(obj: unknown): Ref | undefined {
    return this._references.get(obj)
  }

  add_ref(obj: unknown, ref: Ref): void {
    assert(!this._references.has(obj))
    this._references.set(obj, ref)
  }

  add_def(obj: unknown, def: Struct): void {
    const ref = this.get_ref(obj)
    assert(ref != null)
    this._definitions.set(obj, def)
    this._refmap.set(ref, def)
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

  resolve_ref(ref: Ref): Struct | undefined {
    return this._refmap.get(ref)
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
    const ref = this.get_ref(obj)
    if (ref != null)
      return ref
    else if (is_Serializable(obj))
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
