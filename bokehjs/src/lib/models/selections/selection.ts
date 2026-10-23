import {Model} from "../../model"
import type * as p from "core/properties"
import type {SelectionMode} from "core/enums"
import {union, intersection, difference, symmetric_difference} from "core/util/array"
import {merge} from "core/util/object"
import type {Glyph, GlyphView} from "../glyphs/glyph"
import {Arrayable, Int, Mapping, List, Struct} from "core/kinds"
import {map} from "core/util/arrayable"
import type {HasProps} from "core/has_props"
import type {Attrs} from "core/types"
import type {Serializer} from "core/serialization"
import {RaggedArray} from "core/util/ragged_array"

function normalize_indices(indices: OpaqueIndices): Int32Array {
  if (indices.constructor == Int32Array) {
    return indices as Int32Array
  }
  for (const index of indices) {
    if (!Number.isInteger(index) || index < -2147483648 || index > 2147483647) {
      throw new Error("selection indices must be int32 integers")
    }
  }
  return new Int32Array(indices)
}

function normalize_multiline_indices(indices: MultiIndices): Map<number, Int32Array> {
  if ([...indices.values()].every((values) => values.constructor == Int32Array)) {
    return indices as Map<number, Int32Array>
  }
  return new Map([...indices].map(([key, values]) => [key, normalize_indices(values)]))
}

function serialize_indices(indices: OpaqueIndices, serializer: Serializer): unknown {
  return serializer.encode(normalize_indices(indices))
}

function serialize_multiline_indices(indices: MultiIndices, serializer: Serializer): unknown {
  if (!serializer.binary || indices.size == 0) {
    return serializer.encode(normalize_multiline_indices(indices))
  }
  const packed = RaggedArray.from([...indices.values()].map(normalize_indices), Int32Array)
  return serializer.encode(new Map([...indices.keys()].map((key, i) => [key, packed.get(i)])))
}

export const OpaqueIndices = Arrayable(Int)
export type OpaqueIndices = typeof OpaqueIndices["__type__"]

export const MultiIndices = Mapping(Int, OpaqueIndices)
export type MultiIndices = typeof MultiIndices["__type__"]

export const ImageIndex = Struct({index: Int, i: Int, j: Int, flat_index: Int})
export type ImageIndex = typeof ImageIndex["__type__"]

export const ImageIndices = List(ImageIndex)
export type ImageIndices = typeof ImageIndices["__type__"]

export namespace Selection {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    indices: p.Property<OpaqueIndices>
    line_indices: p.Property<OpaqueIndices>
    multiline_indices: p.Property<MultiIndices>
    image_indices: p.Property<ImageIndices>
    view: p.Property<GlyphView | null>
    selected_glyphs: p.Property<Glyph[]>
  }
}

export interface Selection extends Selection.Attrs {
  get indices(): Int32Array
  set indices(value: OpaqueIndices)
  get line_indices(): Int32Array
  set line_indices(value: OpaqueIndices)
  get multiline_indices(): Map<number, Int32Array>
  set multiline_indices(value: MultiIndices)
}

export class Selection extends Model {
  declare properties: Selection.Props

  override setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    // Compare canonical values so list ingestion doesn't emit an equal-valued change.
    const attrs: Attrs = {...changed_attrs}
    for (const attr of ["indices", "line_indices"] as const) {
      if (Object.hasOwn(attrs, attr)) {
        attrs[attr] = normalize_indices(attrs[attr] as OpaqueIndices)
      }
    }
    if (Object.hasOwn(attrs, "multiline_indices")) {
      attrs.multiline_indices = normalize_multiline_indices(attrs.multiline_indices as MultiIndices)
    }
    super.setv(attrs, options)
  }

  get_view(): GlyphView | null {
    return this.view
  }

  static {
    this.define<Selection.Props>({
      indices:           [ OpaqueIndices, () => new Int32Array(), {convert: normalize_indices, serialize: serialize_indices} ],
      line_indices:      [ OpaqueIndices, () => new Int32Array(), {convert: normalize_indices, serialize: serialize_indices} ],
      multiline_indices: [ MultiIndices, new Map(), {convert: normalize_multiline_indices, serialize: serialize_multiline_indices} ],
      image_indices:     [ ImageIndices, [] ],
    })

    this.internal<Selection.Props>(({List, AnyRef, Nullable}) => ({
      selected_glyphs:   [ List(AnyRef()), [] ],
      view:              [ Nullable(AnyRef()), null ],
    }))
  }

  get selected_glyph(): Glyph | null {
    return this.selected_glyphs.length > 0 ? this.selected_glyphs[0] : null
  }

  add_to_selected_glyphs(glyph: Glyph): void {
    this.selected_glyphs.push(glyph)
  }

  update(selection: Selection, _final: boolean = true, mode: SelectionMode = "replace"): void {
    switch (mode) {
      case "replace": {
        this.update_through_replacement(selection)
        break
      }
      case "toggle": {
        this.update_through_toggle(selection)
        break
      }
      case "append": {
        this.update_through_union(selection)
        break
      }
      case "intersect": {
        this.update_through_intersection(selection)
        break
      }
      case "subtract": {
        this.update_through_subtraction(selection)
        break
      }
      case "xor": {
        this.update_through_symmetric_difference(selection)
        break
      }
    }
  }

  // TODO `size` wouldn't be needed if `indices` was an instance of
  // `Indices` class, instead of an array of numbers. Then also we
  // could just call `.invert()` on the class.
  invert(size: number): void {
    const indices = new Set(this.indices)
    const inversion = []
    for (let i = 0; i < size; i++) {
      if (!indices.has(i)) {
        inversion.push(i)
      }
    }
    this.indices = inversion
    // this.line_indices
    // this.multiline_indices
    // this.image_indices
  }

  clear(): void {
    this.indices = []
    this.line_indices = []
    this.multiline_indices = new Map()
    this.image_indices = []
    this.view = null
    this.selected_glyphs = []
  }

  map(mapper: (index: number) => number): Selection {
    return Selection.create({
      ...this.attributes,
      indices: map(this.indices, mapper),
      // NOTE: line_indices don't support subset indexing
      multiline_indices: new Map(map([...this.multiline_indices.entries()], ([index, line_indices]) => [mapper(index), line_indices])),
      image_indices: this.image_indices.map((image_index) => ({...image_index, index: mapper(image_index.index)})),
    })
  }

  is_empty(): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0 && this.image_indices.length == 0 && this.selected_glyphs.length == 0
  }

  protected _union_image_indices(...collection: ImageIndices[]): ImageIndices {
    const is = new Map<number, Set<number>>()
    const js = new Map<number, Set<number>>()

    const result: ImageIndices = []

    for (const indices of collection) {
      for (const image_index of indices) {
        const {index, i, j} = image_index

        const iis = is.get(index)
        const ijs = js.get(index)

        if (iis != null && ijs != null) {
          if (!iis.has(i) || !ijs.has(j)) {
            result.push(image_index)
            iis.add(i)
            ijs.add(j)
          }
        } else {
          result.push(image_index)
          is.set(index, new Set([i]))
          js.set(index, new Set([j]))
        }
      }
    }
    return result
  }

  update_through_replacement(other: Selection): void {
    this.indices = other.indices
    this.line_indices = other.line_indices
    this.multiline_indices = other.multiline_indices
    this.image_indices = other.image_indices
    this.view = other.view
    this.selected_glyphs = other.selected_glyphs
  }

  update_through_toggle(other: Selection): void {
    // note the order of arguments when comparing with update_through_subtraction()
    this.indices = difference(other.indices, this.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.image_indices = this._union_image_indices(this.image_indices, other.image_indices) // TODO
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_union(other: Selection): void {
    this.indices = union(this.indices, other.indices)
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.image_indices = this._union_image_indices(this.image_indices, other.image_indices) // TODO
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_intersection(other: Selection): void {
    this.indices = intersection(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.image_indices = this._union_image_indices(this.image_indices, other.image_indices) // TODO
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_subtraction(other: Selection): void {
    this.indices = difference(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.image_indices = this._union_image_indices(this.image_indices, other.image_indices) // TODO
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_symmetric_difference(other: Selection): void {
    this.indices = symmetric_difference(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.image_indices = this._union_image_indices(this.image_indices, other.image_indices) // TODO
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }
}
