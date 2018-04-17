import {Arrayable} from "core/types"
import {NumberSpec} from "core/vectorization"
import {SpatialIndex, IndexedRect} from "core/util/spatial"
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

      points.push({minX: x, minY: y, maxX: x, maxY: y, i})
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
  export interface Attrs extends Glyph.Attrs {
    x: NumberSpec
    y: NumberSpec
  }

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {}
}

export interface XYGlyph extends XYGlyph.Attrs {}

export abstract class XYGlyph extends Glyph {

  properties: XYGlyph.Props

  constructor(attrs?: Partial<XYGlyph.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "XYGlyph"

    this.coords([['x', 'y']])
  }
}
XYGlyph.initClass()
