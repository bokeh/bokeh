import {ModelResolver} from "../base"
import {HasProps} from "./has_props"
import {ID, Attrs, PlainObject} from "./types"
import {Ref, is_ref} from "./util/refs"
import {Buffers, decode_bytes, BytesRef, NDArrayRef} from "./util/serialization"
import {ndarray} from "./util/ndarray"
import {entries} from "./util/object"
import {map} from "./util/array"
import {BYTE_ORDER} from "./util/platform"
import {swap} from "./util/buffer"
import {isArray, isPlainObject, isString, isNumber} from "./util/types"
import {type Document} from "document"

export type RefMap = Map<ID, HasProps>

export type AnyVal = null | boolean | number | string | AnyRef | AnyVal[]
export type AnyRef = Ref | NumberRef | ArrayRef | SetRef | MapRef | BytesRef | NDArrayRef | ObjectRef

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

export type ObjectRef = {
  type: string
  attributes: {[key: string]: AnyVal}
}

export type ModelRef = ObjectRef & {
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

  decode(obj: AnyVal, refs: ModelRef[], buffers: Buffers = new Map(), document?: Document): unknown {
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

  protected _decode(obj: AnyVal): unknown {
    if (is_ref(obj)) {
      const resolved = this.references.get(obj.id)
      if (resolved != null)
        return resolved
      else {
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
    } else if (isArray(obj)) {
      return map(obj, (item) => this._decode(item))
    } else if (isPlainObject(obj)) {
      if (!("type" in obj)) {
        const decoded: PlainObject = {}
        for (const [key, val] of entries(obj)) {
          decoded[key] = this._decode(val)
        }
        return decoded
      } else {
        switch (obj.type) {
          case "number": {
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
          }
          case "array": {
            const decoded = []
            if ("entries" in obj && isArray(obj.entries)) {
              for (const entry of obj.entries) {
                decoded.push(this._decode(entry))
              }
            }
            return decoded
          }
          case "set": {
            const decoded = new Set()
            if ("entries" in obj && isArray(obj.entries)) {
              for (const entry of obj.entries) {
                decoded.add(this._decode(entry))
              }
            }
            return decoded
          }
          case "map": {
            const decoded = new Map()
            if ("entries" in obj && isArray(obj.entries)) {
              for (const entry of obj.entries) {
                const [key, val] = entry
                decoded.set(this._decode(key), this._decode(val))
              }
            }
            return decoded
          }
          case "bytes": {
            if ("data" in obj)
              return decode_bytes(obj, this._buffers)
          }
          case "ndarray": {
            if ("array" in obj) {
              const {array, shape, dtype, order} = obj

              const decoded = this._decode(array)
              if (decoded instanceof ArrayBuffer) {
                if (order != BYTE_ORDER) {
                  swap(decoded, dtype)
                }
                return ndarray(decoded, {dtype, shape})
              } else
                return decoded // TODO: should be an ndarray
            }
          }
          default: {
            if (obj.type && "attributes" in obj) {
              const model = this.resolver.get(obj.type)

              if ("id" in obj) {
                throw new Error("'id' is unexpected in this context")
              }

              const attrs = this._decode(obj.attributes)
              return new (model as any)(attrs)
            }
          }
        }

        throw new Error(`unable to decode an object of type '${obj.type}'`)
      }
    } else
      return obj
  }
}
