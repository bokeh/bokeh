import {Model} from "../../model"
import * as p from "core/properties"
import {union, intersection} from "core/util/array"

export class Selection extends Model {

  indices: number[]
  final: boolean
  [key: string]: any

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)

    this['0d'] = {'glyph': null, 'indices': []}
    this['2d'] = {'indices': {}}
    this['1d'] = {'indices': this.indices}

    this.connect(this.properties.indices.change, () =>
      this['1d']['indices'] = this.indices)
  }

  update(selection: Selection, final: boolean, append: boolean): void {
    this.final = final
    if (append)
      this.update_through_union(selection)
    else
      this.indices = selection.indices
  }

  clear (): void {
    this.final = true
    this.indices = []
  }

  is_empty (): boolean {
    return this.indices.length == 0
  }

  update_through_union(other: Selection): void {
    this.indices = union(other.indices, this.indices)
  }

  update_through_intersection(other: Selection): void {
    this.indices = intersection(other.indices, this.indices)
  }
}

Selection.prototype.type = "Selection"

Selection.define({
  indices:      [ p.Array,   [] ]
})

Selection.internal({
  final:        [ p.Boolean     ]
})
