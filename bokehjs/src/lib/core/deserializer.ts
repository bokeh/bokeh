import {ModelResolver} from "../base"
import {HasProps} from "./has_props"
import {ID, Attrs, PlainObject} from "./types"
import {Ref, is_ref} from "./util/refs"
import {Buffers, decode_bytes, BytesRef, NDArrayRef} from "./util/serialization"
import {ndarray, NDArray} from "./util/ndarray"
import {entries} from "./util/object"
import {map, every} from "./util/array"
import {BYTE_ORDER} from "./util/platform"
import {swap} from "./util/buffer"
import {isArray, isPlainObject, isString, isNumber} from "./util/types"
import {type Document} from "document"

export type RefMap = Map<ID, HasProps>

export type AnyVal = null | boolean | number | string | Ref | AnyRef | AnyVal[]
export type AnyRef = NumberRef | ArrayRef | SetRef | MapRef | BytesRef | NDArrayRef | TypeRef

export type NumberRef = {
  type: "number"
  value: number | "nan" | "-inf" | "+inf"
}

export type ArrayRef = {
  type: "array"
  entries: AnyVal[]
}

export type SetRef = {
  type: "set"
  entries: AnyVal[]
}

export type MapRef = {
  type: "map"
  entries: [AnyVal, AnyVal][]
}

export type TypeRef = {
  type: string
  attributes: {[key: string]: AnyVal}
}

export type ModelRef = TypeRef & {
  id: string
}

export class Deserializer {

  constructor(
    readonly resolver: ModelResolver = new ModelResolver(),
    readonly references: RefMap = new Map()) {}

  protected _refs: Map<ID, ModelRef> = new Map()
  protected _buffers: Buffers = new Map()
  protected _to_finalize: HasProps[] = []

  protected _instantiate_object(id: string, type: string): HasProps {
    const model = this.resolver.get(type)
    return new (model as any)({id})
  }

  decode(obj: unknown /*AnyVal*/, refs: ModelRef[], buffers: Buffers = new Map(), document?: Document): unknown {
    this._refs = new Map(refs.map((ref) => [ref.id, ref]))
    this._buffers = buffers
    this._to_finalize = []
    const to_finalize = this._to_finalize

    const decoded = (() => {
      try {
        return this._decode(obj)
      } finally {
        this._refs = new Map()
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
    if (is_ref(obj)) {
      return this._decode_ref(obj)
    } else if (isArray(obj)) {
      return this._decode_plain_array(obj)
    } else if (isPlainObject(obj)) {
      if ("type" in obj) {
        switch (obj.type) {
          case "number":
            return this._decode_number(obj as NumberRef)
          case "array":
            return this._decode_array(obj as ArrayRef)
          case "set":
            return this._decode_set(obj as SetRef)
          case "map":
            return this._decode_map(obj as MapRef)
          case "bytes":
            return this._decode_bytes(obj as BytesRef)
          case "ndarray":
            return this._decode_ndarray(obj as NDArrayRef)
          default: {
            if ("attributes" in obj && !("id" in obj)) {
              return this._decode_type(obj as TypeRef)
            }
          }
        }
      } else {
        return this._decode_plain_object(obj)
      }

      throw new Error(`unable to decode an object of type '${obj.type}'`)
    } else
      return obj
  }

  protected _decode_number(obj: NumberRef): number {
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

    throw new Error(`invalid number representation '${obj}'`)
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

  protected _decode_array(obj: ArrayRef): unknown[] {
    const decoded = []
    for (const entry of obj.entries) {
      decoded.push(this._decode(entry))
    }
    return decoded
  }

  protected _decode_set(obj: SetRef): Set<unknown> {
    const decoded = new Set()
    for (const entry of obj.entries) {
      decoded.add(this._decode(entry))
    }
    return decoded
  }

  protected _decode_map(obj: MapRef): Map<unknown, unknown> | {[key: string]: unknown} {
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

  protected _decode_bytes(obj: BytesRef): ArrayBuffer {
    return decode_bytes(obj, this._buffers)
  }

  protected _decode_ndarray(obj: NDArrayRef): NDArray {
    const {array, shape, dtype, order} = obj

    const decoded = this._decode(array)
    if (decoded instanceof ArrayBuffer) {
      if (order != BYTE_ORDER) {
        swap(decoded, dtype)
      }
      return ndarray(decoded, {dtype, shape})
    } else
      return decoded as any // TODO: should be an ndarray
  }

  protected _decode_type(obj: TypeRef): unknown {
    const cls = this.resolver.get(obj.type)
    const attrs = this._decode(obj.attributes)
    return new (cls as any)(attrs)
  }

  protected _decode_ref(obj: Ref): HasProps {
    const instance = this.references.get(obj.id)
    if (instance != null)
      return instance

    const model_ref = this._refs.get(obj.id)
    if (model_ref != null) {
      const {id, type, attributes} = model_ref

      const instance = this._instantiate_object(id, type)
      this.references.set(id, instance)

      const decoded_attributes = this._decode(attributes) as Attrs
      instance.setv(decoded_attributes, {silent: true})
      this._to_finalize.push(instance)

      return instance
    } else
      throw new Error(`reference ${obj} isn't known`)
  }
}
