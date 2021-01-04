import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {LineVector, FillVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {NumberArray, Rect} from "core/types"
import * as p from "core/properties"

export interface CenterRotatableData extends XYGlyphData {
  _angle: NumberArray
  _width: NumberArray
  _height: NumberArray

  sw: NumberArray
  sh: NumberArray

  max_width: number
  max_height: number
}

export interface CenterRotatableView extends CenterRotatableData {}

export abstract class CenterRotatableView extends XYGlyphView {
  model: CenterRotatable
  visuals: CenterRotatable.Visuals

  get max_w2(): number {
    return this.model.properties.width.units == "data" ? this.max_width/2 : 0
  }

  get max_h2(): number {
    return this.model.properties.height.units == "data" ? this.max_height/2 : 0
  }

  protected _bounds({x0, x1, y0, y1}: Rect): Rect {
    const {max_w2, max_h2} = this
    return {
      x0: x0 - max_w2,
      x1: x1 + max_w2,
      y0: y0 - max_h2,
      y1: y1 + max_h2,
    }
  }
}

export namespace CenterRotatable {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    angle: p.AngleSpec
    width: p.DistanceSpec
    height: p.DistanceSpec
  } & Mixins

  export type Mixins = LineVector & FillVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector}
}

export interface CenterRotatable extends CenterRotatable.Attrs {}

export abstract class CenterRotatable extends XYGlyph {
  properties: CenterRotatable.Props
  __view_type__: CenterRotatableView

  constructor(attrs?: Partial<CenterRotatable.Attrs>) {
    super(attrs)
  }

  static init_CenterRotatable(): void {
    this.mixins<CenterRotatable.Mixins>([LineVector, FillVector])

    this.define<CenterRotatable.Props>(({}) => ({
      angle:  [ p.AngleSpec, 0 ],
      width:  [ p.DistanceSpec ],
      height: [ p.DistanceSpec ],
    }))
  }
}
