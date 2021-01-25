import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {ScreenArray, Rect} from "core/types"
import * as p from "core/properties"

export type CenterRotatableData = XYGlyphData & p.UniformsOf<CenterRotatable.Mixins> & {
  readonly angle: p.Uniform<number>

  readonly width: p.Uniform<number>
  readonly height: p.Uniform<number>

  sw: ScreenArray
  sh: ScreenArray

  readonly max_width: number
  readonly max_height: number
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

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface CenterRotatable extends CenterRotatable.Attrs {}

export abstract class CenterRotatable extends XYGlyph {
  properties: CenterRotatable.Props
  __view_type__: CenterRotatableView

  constructor(attrs?: Partial<CenterRotatable.Attrs>) {
    super(attrs)
  }

  static init_CenterRotatable(): void {
    this.mixins<CenterRotatable.Mixins>([LineVector, FillVector, HatchVector])

    this.define<CenterRotatable.Props>(({}) => ({
      angle:  [ p.AngleSpec, 0 ],
      width:  [ p.DistanceSpec, {field: "width"} ],
      height: [ p.DistanceSpec, {field: "height"} ],
    }))
  }
}
