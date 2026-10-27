import {serialize, type Serializable, type Serializer, type BytesRep} from "core/serialization"
import {Deserializer} from "core/serialization/deserializer"
import {Kind, Arrayable, Int, Mapping} from "core/kinds"
import {isArrayable} from "core/util/types"
import type {OpaqueIndices, MultiIndices} from "./selection"

const MAX_INDEX = 2147483647
// Require a useful saving after accounting for bitmap metadata.
const SAVING_MARGIN = 64
const multiline_kind = Mapping(Int, Arrayable(Int))

type Descriptor = {
  mode: "int32" | "bitmap"
  count: number
  origin?: number
  span?: number
}
type Row = Descriptor & {offset: number, length: number}
type IndicesRep = Descriptor & {type: "selection_indices_v1", data: BytesRep}
type MultiIndicesRep = {type: "selection_map_v1", rows: [number, Row][], data: BytesRep}

export function normalize_indices(values: OpaqueIndices): number[] {
  if (!isArrayable(values)) {
    throw new Error("selection indices must be an integer sequence")
  }
  const count = values.length
  const origin = values[0]
  if (count > 0 && Number.isInteger(origin) && origin >= 0 && values[count - 1] === origin + count - 1 && values[count - 1] <= MAX_INDEX) {
    let dense = true
    for (let i = 1; i < count - 1; i++) {
      if (values[i] !== origin + i) {
        dense = false
        break
      }
    }
    if (dense) {
      return Array.isArray(values) ? values : Array.from(values)
    }
  }
  let increasing = true
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (!Number.isInteger(value) || value < 0 || value > MAX_INDEX) {
      throw new Error("selection indices must be nonnegative int32 integers")
    }
    if (i > 0 && value <= values[i - 1]) {
      increasing = false
    }
  }
  if (increasing && Array.isArray(values)) {
    return values
  }
  const result = Array.from(values)
  if (!increasing) {
    result.sort((a, b) => a - b)
    let n = 0
    for (const value of result) {
      if (n == 0 || value != result[n - 1]) {
        result[n++] = value
      }
    }
    result.length = n
  }
  return result
}

function normalize_multiline(indices: MultiIndices): Map<number, number[]> {
  indices = multiline_kind.coerce(indices) as MultiIndices
  if (!(indices instanceof Map)) {
    throw new Error("multiline indices must be a map")
  }
  return new Map([...indices].sort(([a], [b]) => a - b).map(([key, values]) => {
    integer(key, "multiline key")
    return [key, normalize_indices(values)]
  }))
}

// Wire-only wrappers leave public arrays and maps with ordinary serialization.
export class Indices implements Serializable {
  constructor(readonly values: OpaqueIndices) {}

  [serialize](serializer: Serializer): unknown {
    return encode_indices(normalize_indices(this.values), serializer)
  }
}

export class MultilineIndices implements Serializable {
  constructor(readonly values: MultiIndices) {}

  [serialize](serializer: Serializer): unknown {
    const indices = normalize_multiline(this.values)
    if (!serializer.binary || indices.size == 0) {
      return serializer.encode(new Map(indices))
    }
    const rows: [number, Row][] = []
    const chunks: Uint8Array[] = []
    let offset = 0
    for (const [key, values] of indices) {
      const [meta, data] = pack(values)
      const padding = (-offset) & 3
      if (padding != 0) {
        chunks.push(new Uint8Array(padding))
      }
      offset += padding
      rows.push([key, {...meta, offset, length: data.byteLength}])
      chunks.push(data)
      offset += data.byteLength
    }
    const data = new Uint8Array(offset)
    let cursor = 0
    for (const chunk of chunks) {
      data.set(chunk, cursor)
      cursor += chunk.byteLength
    }
    return {type: "selection_map_v1", rows, data: serializer.encode(data.buffer)}
  }
}

export class IndicesKind extends Kind<OpaqueIndices> {
  override coerce(value: OpaqueIndices): number[] {
    return normalize_indices(value)
  }

  valid(value: unknown): value is OpaqueIndices {
    return Array.isArray(value)
  }

  may_have_refs(): boolean {
    return false
  }
}

export class MultilineIndicesKind extends Kind<MultiIndices> {
  override coerce(value: MultiIndices): Map<number, number[]> {
    return normalize_multiline(value)
  }

  valid(value: unknown): value is MultiIndices {
    return value instanceof Map
  }

  may_have_refs(): boolean {
    return false
  }
}

function pack(values: number[]): [Descriptor, Uint8Array] {
  const count = values.length
  const origin = count != 0 ? values[0] : 0
  const span = count != 0 ? values[count - 1] - origin + 1 : 0
  const bytes = Math.ceil(span/8)
  if (count != 0 && bytes + SAVING_MARGIN < count*4) {
    const data = new Uint8Array(bytes)
    if (count == span) {
      data.fill(255)
      if (span%8 != 0) {
        data[data.length - 1] &= (1 << (span%8)) - 1
      }
    } else {
      for (const value of values) {
        const relative = value - origin
        data[relative >>> 3] |= 1 << (relative & 7)
      }
    }
    return [{mode: "bitmap", count, origin, span}, data]
  }
  const data = new Uint8Array(count*4)
  const view = new DataView(data.buffer)
  for (let i = 0; i < count; i++) {
    view.setInt32(i*4, values[i], true)
  }
  return [{mode: "int32", count}, data]
}

function encode_indices(value: number[], serializer: Serializer): unknown {
  if (!serializer.binary || value.length == 0) {
    return serializer.encode(Array.from(value))
  }
  const [meta, data] = pack(value)
  return {type: "selection_indices_v1", ...meta, data: serializer.encode(data.buffer)}
}

function integer(value: unknown, name: string, max: number = MAX_INDEX): number {
  if (typeof value != "number" || !Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new Error(`invalid selection ${name}`)
  }
  return value
}

function unpack(meta: {mode: unknown, count: unknown, origin?: unknown, span?: unknown}, data: Uint8Array): number[] {
  const count = integer(meta.count, "count", MAX_INDEX + 1)
  if (meta.mode == "int32") {
    if (data.byteLength != count*4) {
      throw new Error("selection int32 length mismatch")
    }
    const values = new Array<number>(count)
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    for (let i = 0; i < count; i++) {
      const value = view.getInt32(i*4, true)
      if (value < 0 || (i > 0 && value <= values[i - 1])) {
        throw new Error("selection int32 indices must be sorted and unique")
      }
      values[i] = value
    }
    return values
  }
  if (meta.mode != "bitmap") {
    throw new Error("unsupported selection encoding")
  }
  const origin = integer(meta.origin, "origin")
  const span = integer(meta.span, "span", MAX_INDEX + 1)
  if (span == 0 || count == 0 || count > span || origin + span - 1 > MAX_INDEX || data.length != Math.ceil(span/8)) {
    throw new Error("invalid selection bitmap bounds")
  }
  if (span%8 != 0 && data[data.length - 1] >>> (span%8) != 0) {
    throw new Error("nonzero selection padding bits")
  }
  if (count == span) {
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i] != 255) {
        throw new Error("selection bitmap cardinality mismatch")
      }
    }
    if (data[data.length - 1] != (span%8 != 0 ? (1 << (span%8)) - 1 : 255)) {
      throw new Error("selection bitmap cardinality mismatch")
    }
    const values = new Array<number>(count)
    for (let i = 0; i < count; i++) {
      values[i] = origin + i
    }
    return values
  }
  const values: number[] = []
  for (let i = 0; i < data.length; i++) {
    let word = data[i]
    while (word != 0) {
      if (values.length == count) {
        throw new Error("selection bitmap cardinality mismatch")
      }
      values.push(origin + i*8 + 31 - Math.clz32(word & -word))
      word &= word - 1
    }
  }
  if (values.length != count) {
    throw new Error("selection bitmap cardinality mismatch")
  }
  return values
}

function decode(rep: IndicesRep | MultiIndicesRep, deserializer: Deserializer): number[] | Map<number, number[]> {
  const data = new Uint8Array(deserializer.decode(rep.data) as ArrayBuffer)
  if (rep.type == "selection_indices_v1") {
    return unpack(rep, data)
  }
  const rows: unknown = rep.rows
  if (!Array.isArray(rows)) {
    throw new Error("invalid selection rows")
  }
  const result = new Map<number, number[]>()
  let previous = -1
  let end = 0
  for (const row of rows) {
    if (!Array.isArray(row) || row.length != 2 || row[1] == null || typeof row[1] != "object") {
      throw new Error("invalid selection row")
    }
    const [key, meta] = row
    integer(key, "multiline key")
    const offset = integer(meta.offset, "offset", data.length)
    const length = integer(meta.length, "length", data.length)
    if (key <= previous || offset != Math.ceil(end/4)*4 || offset + length > data.length) {
      throw new Error("invalid selection row bounds or order")
    }
    for (let i = end; i < offset; i++) {
      if (data[i] != 0) {
        throw new Error("invalid selection row padding")
      }
    }
    result.set(key, unpack(meta, data.subarray(offset, offset + length)))
    previous = key
    end = offset + length
  }
  if (end != data.length) {
    throw new Error("unreferenced selection data")
  }
  return result
}

Deserializer.register("selection_indices_v1", decode)
Deserializer.register("selection_map_v1", decode)

export function selection_wire_value(attr: string, value: unknown): unknown {
  switch (attr) {
    case "indices":
    case "line_indices": return new Indices(value as OpaqueIndices)
    case "multiline_indices": return new MultilineIndices(value as MultiIndices)
    default: return value
  }
}
