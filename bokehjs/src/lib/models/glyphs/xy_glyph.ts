import {Arrayable} from "core/types"
import {SpatialIndex, IndexedRect} from "core/util/spatial"
import * as p from "core/properties"
import {Glyph, GlyphView, GlyphData} from "./glyph"

export interface XYGlyphData extends GlyphData {
  _x: Arrayable<number>
  _y: Arrayable<number>

  sx: Arrayable<number>
  sy: Arrayable<number>
}

export interface XYGlyphView extends XYGlyphData {}

export abstract class XYGlyphView extends GlyphView {
  model: XYGlyph
  visuals: XYGlyph.Visuals

  protected _index_data(): SpatialIndex {
    const points: IndexedRect[] = []

    for (let i = 0, end = this._x.length; i < end; i++) {
      const x = this._x[i]
      const y = this._y[i]

      if (isNaN(x + y) || !isFinite(x + y))
        continue

      points.push({x0: x, y0: y, x1: x, y1: y, i})
    }

    return new SpatialIndex(points)
  }

  scenterx(i: number): number {
    return this.sx[i]
  }

  scentery(i: number): number {
    return this.sy[i]
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

  constructor(attrs?: Partial<XYGlyph.Attrs>) {
    super(attrs)
  }

  static init_XYGlyph(): void {
    this.coords([['x', 'y']])
  }
}
