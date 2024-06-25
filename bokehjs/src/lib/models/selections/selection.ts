import {Model} from "../../model"
import type * as p from "core/properties"
import type {SelectionMode} from "core/enums"
import {union, intersection, difference, symmetric_difference} from "core/util/array"
import {merge} from "core/util/object"
import type {Glyph, GlyphView} from "../glyphs/glyph"
import {Arrayable, Int, Mapping} from "core/kinds"
import {map} from "core/util/arrayable"

export const OpaqueIndices = Arrayable(Int)
export type OpaqueIndices = typeof OpaqueIndices["__type__"]

export const MultiIndices = Mapping(Int, OpaqueIndices)
export type MultiIndices = typeof MultiIndices["__type__"]

export type ImageIndex = {
  index: number
  i: number
  j: number
  flat_index: number
}
export type ImageIndices = ImageIndex[]

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
    this.define<Selection.Props>(({Int, List, Struct}) => ({
      indices:           [ OpaqueIndices, [] ],
      line_indices:      [ OpaqueIndices, [] ],
      multiline_indices: [ MultiIndices, new Map() ],
      image_indices:     [ List(Struct({index: Int, i: Int, j: Int, flat_index: Int})), [] ],
    }))

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
    return new Selection({
      ...this.attributes,
      indices: map(this.indices, mapper),
      // NOTE: line_indices don't support subset indexing
      multiline_indices: new Map(map([...this.multiline_indices.entries()], ([index, line_indices]) => [mapper(index), line_indices])),
      image_indices: this.image_indices.map((image_index) => ({...image_index, index: mapper(image_index.index)})),
    })
  }

  is_empty(): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0 && this.image_indices.length == 0
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
