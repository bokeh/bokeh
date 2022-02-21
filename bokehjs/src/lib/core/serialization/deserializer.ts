import {type ModelResolver} from "../../base"
import {type Document} from "../../document"

import {HasProps} from "../has_props"
import {ID, Attrs, PlainObject} from "../types"
import {Ref, is_ref} from "../util/refs"
import {ndarray, NDArray} from "../util/ndarray"
import {entries} from "../util/object"
import {map, every} from "../util/array"
import {BYTE_ORDER} from "../util/platform"
import {base64_to_buffer, swap} from "../util/buffer"
import {isArray, isPlainObject, isString, isNumber} from "../util/types"
import {Slice} from "../util/slice"

import {
  NumberRep, ArrayRep, SetRep, MapRep, BytesRep, SliceRep,
  NDArrayRep, ModelRep, TypeRep,
} from "./reps"

export class DeserializationError extends Error {}

export class Deserializer {

  constructor(
    readonly resolver: ModelResolver,
    readonly references: Map<ID, HasProps> = new Map()) {}

  protected _buffers: Map<ID, ArrayBuffer> = new Map()
  protected _to_finalize: HasProps[] = []

  protected _instantiate_object(id: string, type: string): HasProps {
    const model = this.resolver.get(type)
    return new (model as any)({id})
  }

  decode(obj: unknown /*AnyVal*/, buffers: Map<ID, ArrayBuffer> = new Map(), document?: Document): unknown {
    this._buffers = buffers
    this._to_finalize = []
    const to_finalize = this._to_finalize

    const decoded = (() => {
      try {
        return this._decode(obj)
      } finally {
        this._buffers = new Map()
        this._to_finalize = []
      }
    })()

    for (const instance of to_finalize) {
      instance.finalize_props()
      if (document != null)
        instance.attach_document(document)
      instance.finalize()
    }

    // `connect_signals` has to be executed last because it may rely on properties
    // of dependencies that are initialized only in `finalize`. It's a problem
    // that appears when there are circular references, e.g. as in
    // CDS -> CustomJS (on data change) -> GlyphRenderer (in args) -> CDS.
    for (const instance of to_finalize) {
      instance.connect_signals()
    }

    return decoded
  }

  protected _decode(obj: unknown /*AnyVal*/): unknown {
    if (isArray(obj)) {
      return this._decode_plain_array(obj)
    } else if (isPlainObject(obj)) {
      if ("id" in obj && !("type" in obj)) {
        return this._decode_ref(obj as Ref)
      } else if ("type" in obj) {
        switch (obj.type) {
          case "number":
            return this._decode_number(obj as NumberRep)
          case "array":
            return this._decode_array(obj as ArrayRep)
          case "set":
            return this._decode_set(obj as SetRep)
          case "map":
            return this._decode_map(obj as MapRep)
          case "bytes":
            return this._decode_bytes(obj as BytesRep)
          case "slice":
            return this._decode_slice(obj as SliceRep)
          case "ndarray":
            return this._decode_ndarray(obj as NDArrayRep)
          default: {
            if ("attributes" in obj) {
              if ("id" in obj) {
                return this._decode_type_ref(obj as ModelRep)
              } else {
                return this._decode_type(obj as TypeRep)
              }
            }
          }
        }
      } else {
        return this._decode_plain_object(obj)
      }

      this.error(`unable to decode an object of type '${obj.type}'`)
    } else
      return obj
  }

  protected _decode_number(obj: NumberRep): number {
    if ("value" in obj) {
      const {value} = obj
      if (isString(value)) {
        switch (value) {
          case "nan":  return NaN
          case "+inf": return +Infinity
          case "-inf": return -Infinity
        }
      } else if (isNumber(value))
        return value
    }

    this.error(`invalid number representation '${obj}'`)
  }

  protected _decode_plain_array(obj: unknown[]): unknown[] {
    return map(obj, (item) => this._decode(item))
  }

  protected _decode_plain_object(obj: PlainObject): PlainObject {
    const decoded: PlainObject = {}
    for (const [key, val] of entries(obj)) {
      decoded[key] = this._decode(val)
    }
    return decoded
  }

  protected _decode_array(obj: ArrayRep): unknown[] {
    const decoded = []
    for (const entry of obj.entries) {
      decoded.push(this._decode(entry))
    }
    return decoded
  }

  protected _decode_set(obj: SetRep): Set<unknown> {
    const decoded = new Set()
    for (const entry of obj.entries) {
      decoded.add(this._decode(entry))
    }
    return decoded
  }

  protected _decode_map(obj: MapRep): Map<unknown, unknown> | {[key: string]: unknown} {
    const decoded = map(obj.entries, ([key, val]) => [this._decode(key), this._decode(val)] as const)
    const is_str = every(decoded, ([key]) => isString(key))
    if (is_str) {
      const obj: {[key: string]: unknown} = {} // Object.create(null)
      for (const [key, val] of decoded) {
        obj[key as string] = val
      }
      return obj
    } else
      return new Map(decoded)
  }

  protected _decode_bytes(obj: BytesRep): ArrayBuffer {
    const {data} = obj
    if (is_ref(data)) {
      const buffer = this._buffers.get(data.id)
      if (buffer != null)
        return buffer
      else
        this.error(`buffer for id=${data.id} not found`)
    } else if (isString(data))
      return base64_to_buffer(data)
    else
      return data.buffer
  }

  protected _decode_slice(obj: SliceRep): Slice {
    const start = this._decode(obj.start) as number | null
    const stop = this._decode(obj.stop) as number | null
    const step = this._decode(obj.step) as number | null
    return new Slice({start, stop, step})
  }

  protected _decode_ndarray(obj: NDArrayRep): NDArray {
    const {array, shape, dtype, order} = obj

    const decoded = this._decode(array) as ArrayBuffer | unknown[]
    if (decoded instanceof ArrayBuffer) {
      if (order != BYTE_ORDER) {
        swap(decoded, dtype)
      }
    }
    return ndarray(decoded as any /*XXX*/, {dtype, shape})
  }

  protected _decode_type(obj: TypeRep): unknown {
    const cls = this.resolver.get(obj.type)
    if (cls == null)
      this.error(`could not resolve model '${obj.type}', which could be due to a widget or a custom model not being registered before first usage`)
    const attrs = this._decode(obj.attributes)
    return new (cls as any)(attrs)
  }

  protected _decode_ref(obj: Ref): HasProps {
    const instance = this.references.get(obj.id)
    if (instance != null)
      return instance
    else
      this.error(`reference ${obj.id} isn't known`)
  }

  protected _decode_type_ref(obj: ModelRep): HasProps {
    if (this.references.has(obj.id))
      this.error(`reference already known '${obj.id}'`)

    const {id, type, attributes} = obj

    const instance = this._instantiate_object(id, type)
    this.references.set(id, instance)

    const decoded_attributes = this._decode(attributes) as Attrs
    instance.setv(decoded_attributes, {silent: true})
    this._to_finalize.push(instance)

    return instance
  }

  error(message: string): never {
    throw new DeserializationError(message)
  }
}
