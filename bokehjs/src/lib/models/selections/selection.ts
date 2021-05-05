import {Model} from "../../model"
import * as p from "core/properties"
import {SelectionMode} from "core/enums"
import {union, intersection, difference} from "core/util/array"
import {merge} from "core/util/object"
import type {Glyph, GlyphView} from "../glyphs/glyph"

export type OpaqueIndices = number[]

export type MultiIndices = {[key: string]: OpaqueIndices}

export type ImageIndex = {
  index: number
  dim1: number
  dim2: number
  flat_index: number
}

export namespace Selection {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    indices: p.Property<OpaqueIndices>
    line_indices: p.Property<OpaqueIndices>
    selected_glyphs: p.Property<Glyph[]>
    view: p.Property<GlyphView | null>
    multiline_indices: p.Property<MultiIndices>
    image_indices: p.Property<ImageIndex[]>
  }
}

export interface Selection extends Selection.Attrs {}

export class Selection extends Model {
  override properties: Selection.Props

  constructor(attrs?: Partial<Selection.Attrs>) {
    super(attrs)
  }

  get_view(): GlyphView | null {
    return this.view
  }

  static init_Selection(): void {
    this.define<Selection.Props>(({Int, Array, Dict}) => ({
      indices:           [ Array(Int), [] ],
      line_indices:      [ Array(Int), [] ],
      multiline_indices: [ Dict(Array(Int)), {} ],
    }))

    this.internal<Selection.Props>(({Int, Array, AnyRef, Struct, Nullable}) => ({
      selected_glyphs:   [ Array(AnyRef()), [] ],
      view:              [ Nullable(AnyRef()), null ],
      // Used internally to support hover tool for now. Python API TBD
      image_indices:     [ Array(Struct({index: Int, dim1: Int, dim2: Int, flat_index: Int})), [] ],
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
        this.indices = selection.indices
        this.line_indices = selection.line_indices
        this.selected_glyphs = selection.selected_glyphs
        this.view = selection.view
        this.multiline_indices = selection.multiline_indices
        this.image_indices = selection.image_indices
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
    }
  }

  clear(): void {
    this.indices = []
    this.line_indices = []
    this.multiline_indices = {}
    this.view = null
    this.selected_glyphs = []
  }

  is_empty(): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0 && this.image_indices.length == 0
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
}
