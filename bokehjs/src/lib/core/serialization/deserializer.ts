import {type HasProps} from "../has_props"
import {type ModelResolver} from "../resolvers"
import {ID, Attrs, PlainObject, TypedArray} from "../types"
import {Ref, is_ref} from "../util/refs"
import {ndarray, NDArray} from "../util/ndarray"
import {entries, Dict} from "../util/object"
import {map, every} from "../util/array"
import {BYTE_ORDER} from "../util/platform"
import {base64_to_buffer, swap} from "../util/buffer"
import {isArray, isPlainObject, isString, isNumber} from "../util/types"
import {Slice} from "../util/slice"
import {Value, Field, Expr} from "../vectorization"

import {
  SymbolRep, NumberRep, ArrayRep, SetRep, MapRep, BytesRep, SliceRep, TypedArrayRep,
  NDArrayRep, ObjectRep, ObjectRefRep, ValueRep, FieldRep, ExprRep,
} from "./reps"

export type Decoder = (rep: any, deserializer: Deserializer) => unknown
const _decoders: Map<string, Decoder> = new Map()

export class DeserializationError extends Error {}

export class Deserializer {

  static register(type: string, decoder: Decoder): void {
    if (!_decoders.has(type))
      _decoders.set(type, decoder)
    else
      throw new Error(`'${type}' already registered for decoding`)
  }

  constructor(
    readonly resolver: ModelResolver,
    readonly references: Map<ID, HasProps> = new Map(),
    readonly finalize?: (obj: HasProps) => void,
  ) {}

  protected _decoding: boolean = false
  protected readonly _buffers: Map<ID, ArrayBuffer> = new Map()
  protected readonly _finalizable: Set<HasProps> = new Set()

  decode(obj: unknown /*AnyVal*/, buffers?: Map<ID, ArrayBuffer>): unknown {
    if (buffers != null) {
      for (const [id, buffer] of buffers) {
        this._buffers.set(id, buffer)
      }
    }

    if (this._decoding) {
      return this._decode(obj)
    }

    this._decoding = true
    let finalizable: Set<HasProps>

    const decoded = (() => {
      try {
        return this._decode(obj)
      } finally {
        finalizable = new Set(this._finalizable)
        this._decoding = false
        this._buffers.clear()
        this._finalizable.clear()
      }
    })()

    for (const instance of finalizable) {
      this.finalize?.(instance)
      instance.finalize()
    }

    // `connect_signals` has to be executed last because it may rely on properties
    // of dependencies that are initialized only in `finalize`. It's a problem
    // that appears when there are circular references, e.g. as in
    // CDS -> CustomJS (on data change) -> GlyphRenderer (in args) -> CDS.
    for (const instance of finalizable) {
      instance.connect_signals()
    }

    return decoded
  }

  protected _decode(obj: unknown /*AnyVal*/): unknown {
    if (isArray(obj)) {
      return this._decode_plain_array(obj)
    } else if (isPlainObject(obj)) {
      if (isString(obj.type)) {
        const decoder = _decoders.get(obj.type)
        if (decoder != null) {
          return decoder(obj, this)
        }
        switch (obj.type) {
          case "ref":
            return this._decode_ref(obj as Ref)
          case "symbol":
            return this._decode_symbol(obj as SymbolRep)
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
          case "value":
            return this._decode_value(obj as ValueRep)
          case "field":
            return this._decode_field(obj as FieldRep)
          case "expr":
            return this._decode_expr(obj as ExprRep)
          case "typed_array":
            return this._decode_typed_array(obj as TypedArrayRep)
          case "ndarray":
            return this._decode_ndarray(obj as NDArrayRep)
          case "object": {
            if (isString(obj.id)) {
              return this._decode_object_ref(obj as ObjectRefRep)
            } else {
              return this._decode_object(obj as ObjectRep)
            }
          }
          default: {
            this.error(`unable to decode an object of type '${obj.type}'`)
          }
        }
      } else if (isString(obj.id)) {
        return this._decode_ref(obj as Ref)
      } else {
        return this._decode_plain_object(obj)
      }
    } else
      return obj
  }

  protected _decode_symbol(obj: SymbolRep): symbol {
    this.error(`can't resolve named symbol '${obj.name}'`) // TODO: implement symbol resolution
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

  protected _decode_value(obj: ValueRep): Value<unknown> {
    const value = this._decode(obj.value)
    const transform = obj.transform != null ? this._decode(obj.transform) : undefined
    const units = obj.units != null ? this._decode(obj.units) : undefined
    return {value, transform, units} as any
  }

  protected _decode_field(obj: FieldRep): Field {
    const field = this._decode(obj.field)
    const transform = obj.transform != null ? this._decode(obj.transform) : undefined
    const units = obj.units != null ? this._decode(obj.units) : undefined
    return {field, transform, units} as any
  }

  protected _decode_expr(obj: ExprRep): Expr<unknown> {
    const expr = this._decode(obj.expr)
    const transform = obj.transform != null ? this._decode(obj.transform) : undefined
    const units = obj.units != null ? this._decode(obj.units) : undefined
    return {expr, transform, units} as any
  }

  protected _decode_typed_array(obj: TypedArrayRep): TypedArray {
    const {array, order, dtype} = obj

    const buffer = this._decode(array) as ArrayBuffer
    if (order != BYTE_ORDER) {
      swap(buffer, dtype)
    }

    switch (dtype) {
      case "uint8":   return new Uint8Array(buffer)
      case "int8":    return new Int8Array(buffer)
      case "uint16":  return new Uint16Array(buffer)
      case "int16":   return new Int16Array(buffer)
      case "uint32":  return new Uint32Array(buffer)
      case "int32":   return new Int32Array(buffer)
      // case "uint64": return new BigInt64Array(buffer)
      // case "int64":  return new BigInt64Array(buffer)
      case "float32": return new Float32Array(buffer)
      case "float64": return new Float64Array(buffer)
      default:
        this.error(`unsupported dtype '${dtype}'`)
    }
  }

  protected _decode_ndarray(obj: NDArrayRep): NDArray {
    const {array, order, dtype, shape} = obj

    const decoded = this._decode(array) as ArrayBuffer | unknown[]
    if (decoded instanceof ArrayBuffer && order != BYTE_ORDER) {
      swap(decoded, dtype)
    }

    return ndarray(decoded as any /*XXX*/, {dtype, shape})
  }

  protected _decode_object(obj: ObjectRep): unknown {
    const {type, attributes} = obj
    const cls = this._resolve_type(type)
    if (attributes != null)
      return new cls(this._decode(attributes))
    else
      return new cls()
  }

  protected _decode_ref(obj: Ref): HasProps {
    const instance = this.references.get(obj.id)
    if (instance != null)
      return instance
    else
      this.error(`reference ${obj.id} isn't known`)
  }

  protected _decode_object_ref(obj: ObjectRefRep): HasProps {
    if (this.references.has(obj.id))
      this.error(`reference already known '${obj.id}'`)

    const {id, name: type, attributes} = obj

    const cls = this._resolve_type(type)
    const instance: HasProps = new cls({id})
    this.references.set(id, instance)

    const decoded_attributes = this._decode(attributes ?? {}) as Attrs
    instance.initialize_props(new Dict(decoded_attributes))

    this._finalizable.add(instance)
    return instance
  }

  error(message: string): never {
    throw new DeserializationError(message)
  }

  private _resolve_type(type: string): any {
    const cls = this.resolver.get(type)
    if (cls != null)
      return cls
    else
      this.error(`could not resolve type '${type}', which could be due to a widget or a custom model not being registered before first usage`)
  }
}
