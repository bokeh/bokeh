import {NumberArray} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {inplace} from "core/util/projections"
import * as p from "core/properties"
import {Glyph, GlyphView, GlyphData} from "./glyph"

export interface XYGlyphData extends GlyphData {
  _x: NumberArray
  _y: NumberArray

  sx: NumberArray
  sy: NumberArray
}

export interface XYGlyphView extends XYGlyphData {}

export abstract class XYGlyphView extends GlyphView {
  model: XYGlyph
  visuals: XYGlyph.Visuals

  protected _project_data(): void {
    inplace.project_xy(this._x, this._y)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = this._x[i]
      const y = this._y[i]

      if (isNaN(x + y) || !isFinite(x + y))
        index.add_empty()
      else
        index.add(x, y, x, y)
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
}

export interface XYGlyph extends XYGlyph.Attrs {}

export abstract class XYGlyph extends Glyph {
  properties: XYGlyph.Props
  __view_type__: XYGlyphView

  constructor(attrs?: Partial<XYGlyph.Attrs>) {
    super(attrs)
  }

  static init_XYGlyph(): void {
    this.define<XYGlyph.Props>({
      x: [ p.XCoordinateSpec, {field: "x"} ],
      y: [ p.YCoordinateSpec, {field: "y"} ],
    })
  }
}
