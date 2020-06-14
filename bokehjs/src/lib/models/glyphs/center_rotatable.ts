import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {LineVector, FillVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {NumberArray} from "core/types"
import * as p from "core/properties"

export interface CenterRotatableData extends XYGlyphData {
  _angle: NumberArray
  _width: NumberArray
  _height: NumberArray

  sw: NumberArray
  sh: NumberArray

  max_width: number
  max_height: number

  max_w2: number
  max_h2: number
}

export interface CenterRotatableView extends CenterRotatableData {}

export abstract class CenterRotatableView extends XYGlyphView {
  model: CenterRotatable
  visuals: CenterRotatable.Visuals
}

export namespace CenterRotatable {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    angle: p.AngleSpec
    width: p.DistanceSpec
    height: p.DistanceSpec
  } & Mixins

  export type Mixins = LineVector & FillVector

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill}
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

    this.define<CenterRotatable.Props>({
      angle:  [ p.AngleSpec,   0     ],
      width:  [ p.DistanceSpec       ],
      height: [ p.DistanceSpec       ],
    })

  }
}
