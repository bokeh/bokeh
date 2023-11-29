import {Model} from "../../model"
import type * as p from "core/properties"
import type {SelectionMode} from "core/enums"
import {union, intersection, difference, symmetric_difference} from "core/util/array"
import {merge, entries, to_object} from "core/util/object"
import type {Glyph, GlyphView} from "../glyphs/glyph"
import {Arrayable, Int} from "../../core/kinds"
import {map} from "core/util/arrayable"

export type OpaqueIndices = typeof OpaqueIndices["__type__"]
export const OpaqueIndices = Arrayable(Int)

export type MultiIndices = {[key: string]: OpaqueIndices}

export type ImageIndex = {
  index: number
  i: number
  j: number
  flat_index: number
}

export namespace Selection {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    indices: p.Property<OpaqueIndices>
    line_indices: p.Property<OpaqueIndices>
    multiline_indices: p.Property<MultiIndices>
    image_indices: p.Property<ImageIndex[]>
    view: p.Property<GlyphView | null>
    selected_glyphs: p.Property<Glyph[]>
  }
}

export interface Selection extends Selection.Attrs {}

export class Selection extends Model {
  declare properties: Selection.Props

  constructor(attrs?: Partial<Selection.Attrs>) {
    super(attrs)
  }

  get_view(): GlyphView | null {
    return this.view
  }

  static {
    this.define<Selection.Props>(({Int, Array, Dict, Struct}) => ({
      indices:           [ OpaqueIndices, [] ],
      line_indices:      [ OpaqueIndices, [] ],
      multiline_indices: [ Dict(OpaqueIndices), {} ],
      image_indices:     [ Array(Struct({index: Int, i: Int, j: Int, flat_index: Int})), [] ],
    }))

    this.internal<Selection.Props>(({Array, AnyRef, Nullable}) => ({
      selected_glyphs:   [ Array(AnyRef()), [] ],
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
    this.multiline_indices = {}
    this.image_indices = []
    this.view = null
    this.selected_glyphs = []
  }

  map(mapper: (index: number) => number): Selection {
    return new Selection({
      ...this.attributes,
      indices: map(this.indices, mapper),
      // NOTE: line_indices don't support subset indexing
      multiline_indices: to_object(entries(this.multiline_indices).map(([index, line_indices]) => [mapper(Number(index)), line_indices])),
      image_indices: this.image_indices.map((ndx) => ({...ndx, index: mapper(ndx.index)})),
    })
  }

  is_empty(): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0 && this.image_indices.length == 0
  }

  update_through_replacement(other: Selection): void {
    this.indices = other.indices
    this.line_indices = other.line_indices
    this.multiline_indices = other.multiline_indices
    this.image_indices = other.image_indices
    this.view = other.view
    this.selected_glyphs = other.selected_glyphs
  }

  update_through_union(other: Selection): void {
    this.indices = union(this.indices, other.indices)
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_intersection(other: Selection): void {
    this.indices = intersection(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_subtraction(other: Selection): void {
    this.indices = difference(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_symmetric_difference(other: Selection): void {
    this.indices = symmetric_difference(this.indices, other.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    this.view = other.view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }
}
