import {Model} from "../../model"
import * as p from "core/properties"
import {union, intersection} from "core/util/array"
import {merge} from "core/util/object"
import {Glyph} from "models/glyphs/glyph"

export class Selection extends Model {

  indices: number[]
  final: boolean
  line_indices: number[]
  selected_glyphs: Glyph[]
  get_view: any
  [key: string]: any

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)

    this['0d'] = {'glyph': null, 'indices': [], 'flag': false,
                  'get_view': () => null}
    this['2d'] = {'indices': {}}
    this['1d'] = {'indices': this.indices}

    this.get_view = () => null

    this.connect(this.properties.indices.change, () =>
      this['1d']['indices'] = this.indices)
    this.connect(this.properties.line_indices.change, () => {
      this['0d']['indices'] = this.line_indices
      if(this.line_indices.length == 0)
        this['0d'].flag = false
      else
        this['0d'].flag = true
      })
    this.connect(this.properties.selected_glyphs.change, () =>
      this['0d'].glyph = this.selected_glyph)
    this.connect(this.properties.get_view.change, () =>
      this['0d'].get_view = this.get_view)
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
    else
      this.indices = selection.indices
      this.line_indices = selection.line_indices
      this.selected_glyphs = selection.selected_glyphs
      this.get_view = selection.get_view
      this['2d'].indices = selection['2d'].indices
  }

  clear (): void {
    this.final = true
    this.indices = []
  }

  is_empty (): boolean {
    return this.indices.length == 0 && this.line_indices.length == 0
  }

  update_through_union(other: Selection): void {
    this.indices = union(other.indices, this.indices)
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    if(!this.get_view())
      this.get_view = other.get_view
    this['2d'].indices = merge(other['2d'].indices, this['2d'].indices)
  }

  update_through_intersection(other: Selection): void {
    this.indices = intersection(other.indices, this.indices)
    // TODO: think through and fix any logic below
    this.selected_glyphs = union(other.selected_glyphs, this.selected_glyphs)
    this.line_indices = union(other.line_indices, this.line_indices)
    if(!this.get_view())
      this.get_view = other.get_view
    this['2d'].indices = merge(other['2d'].indices, this['2d'].indices)
  }
}

Selection.prototype.type = "Selection"

Selection.define({
  indices:         [ p.Array,   [] ]
})

Selection.internal({
  final:           [ p.Boolean     ],
  line_indices:    [ p.Array,   [] ],
  selected_glyphs: [ p.Array,   [] ],
  get_view:        [ p.Any         ]
})
