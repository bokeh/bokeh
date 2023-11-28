import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import * as p from "core/properties"

export interface CenterRotatableView extends CenterRotatable.Data {}

export abstract class CenterRotatableView extends XYGlyphView {
  declare model: CenterRotatable
  declare visuals: CenterRotatable.Visuals

  get max_w2(): number {
    return this.model.properties.width.units == "data" ? this.max_width/2 : 0
  }

  get max_h2(): number {
    return this.model.properties.height.units == "data" ? this.max_height/2 : 0
  }

  protected override _bounds({x0, x1, y0, y1}: Rect): Rect {
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

  export type Data = p.GlyphDataOf<Props>
}

export interface CenterRotatable extends CenterRotatable.Attrs {}

export abstract class CenterRotatable extends XYGlyph {
  declare properties: CenterRotatable.Props
  declare __view_type__: CenterRotatableView

  constructor(attrs?: Partial<CenterRotatable.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<CenterRotatable.Mixins>([LineVector, FillVector, HatchVector])

    this.define<CenterRotatable.Props>(({}) => ({
      angle:  [ p.AngleSpec, 0 ],
      width:  [ p.DistanceSpec, {field: "width"} ],
      height: [ p.DistanceSpec, {field: "height"} ],
    }))
  }
}
