import {Model} from "../../model"
import * as p from "core/properties"
import {union, intersection} from "core/util/array"
import {merge} from "core/util/object"
import {Glyph, GlyphView} from "../glyphs/glyph"

export namespace Selection {
  export interface Attrs extends Model.Attrs {
    indices: number[]
    final: boolean
    line_indices: number[]
    selected_glyphs: Glyph[]
    get_view: () => GlyphView | null
    multiline_indices: {[key: string]: number[]}
  }

  export interface Props extends Model.Props {
    indices: p.Property<number[]>
    final: p.Property<boolean>
    line_indices: p.Property<number[]>
    selected_glyphs: p.Property<Glyph[]>
    get_view: p.Property<() => GlyphView | null>
    multiline_indices: p.Property<{[key: string]: number[]}>
  }
}

export interface Selection extends Selection.Attrs {}

export class Selection extends Model {

  properties: Selection.Props

  constructor(attrs?: Partial<Selection.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Selection";

    this.define({
      indices:           [ p.Array,   [] ],
      line_indices:      [ p.Array,   [] ],
      multiline_indices: [ p.Any,     {} ],
    });

    this.internal({
      final:             [ p.Boolean     ],
      selected_glyphs:   [ p.Array,   [] ],
      get_view:          [ p.Any         ],
      image_indices:     [ p.Array,   [] ], // Used internally to support hover tool for now. Python API TBD
    });
  }

  [key: string]: any

  initialize(): void {
    super.initialize()

    this['0d'] = {glyph: null, indices: [], flag: false, get_view: () => null}
    this['2d'] = {indices: {}}
    this['1d'] = {indices: this.indices}

    this.get_view = () => null

    this.connect(this.properties.indices.change, () =>
      this['1d'].indices = this.indices)
    this.connect(this.properties.line_indices.change, () => {
      this['0d'].indices = this.line_indices
      if(this.line_indices.length == 0)
        this['0d'].flag = false
      else
        this['0d'].flag = true
      })
    this.connect(this.properties.selected_glyphs.change, () =>
      this['0d'].glyph = this.selected_glyph)
    this.connect(this.properties.get_view.change, () =>
      this['0d'].get_view = this.get_view)
    this.connect(this.properties.multiline_indices.change, ()=>
      this['2d'].indices = this.multiline_indices)
  }

  get selected_glyph(): Glyph | null {
    if(this.selected_glyphs.length > 0)
      return this.selected_glyphs[0]
    else
      return null
  }

  add_to_selected_glyphs(glyph: Glyph): void {
    this.selected_glyphs.push(glyph)
  }

  update(selection: Selection, final: boolean, append: boolean): void {
    this.final = final
    if (append)
      this.update_through_union(selection)
    else {
      this.indices = selection.indices
      this.line_indices = selection.line_indices
      this.selected_glyphs = selection.selected_glyphs
      this.get_view = selection.get_view
      this.multiline_indices = selection.multiline_indices
      this.image_indices = selection.image_indices
    }
  }

  clear (): void {
    this.final = true
    this.indices = []
    this.line_indices = []
    this.multiline_indices = {}
    this.get_view = () => null
    this.selected_glyphs = []
  }

  is_empty (): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0 && this.image_indices.length == 0
  }

  update_through_union(other: Selection): void {
    this.indices = union(other.indices, this.indices)
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    if(!this.get_view())
      this.get_view = other.get_view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }

  update_through_intersection(other: Selection): void {
    this.indices = intersection(other.indices, this.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    if(!this.get_view())
      this.get_view = other.get_view
    this.multiline_indices = merge(other.multiline_indices, this.multiline_indices)
  }
}
Selection.initClass()
