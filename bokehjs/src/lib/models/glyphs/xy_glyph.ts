import type {SpatialIndex} from "core/util/spatial"
import {inplace} from "core/util/projections"
import * as p from "core/properties"
import {Glyph, GlyphView} from "./glyph"

export interface XYGlyphView extends XYGlyph.Data {}

export abstract class XYGlyphView extends GlyphView {
  declare model: XYGlyph
  declare visuals: XYGlyph.Visuals

  protected override _project_data(): void {
    inplace.project_xy(this._x, this._y)
  }

  protected _index_data(index: SpatialIndex): void {
    const {_x, _y, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = _x[i]
      const y = _y[i]
      index.add_point(x, y)
    }
  }

  scenterxy(i: number): [number, number] {
    return [this.sx[i], this.sy[i]]
  }
}

export namespace XYGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x: p.CoordinateSpec
    y: p.CoordinateSpec
  }

  export type Visuals = Glyph.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface XYGlyph extends XYGlyph.Attrs {}

export abstract class XYGlyph extends Glyph {
  declare properties: XYGlyph.Props
  declare __view_type__: XYGlyphView

  constructor(attrs?: Partial<XYGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.define<XYGlyph.Props>(({}) => ({
      x: [ p.XCoordinateSpec, {field: "x"} ],
      y: [ p.YCoordinateSpec, {field: "y"} ],
    }))
  }
}
