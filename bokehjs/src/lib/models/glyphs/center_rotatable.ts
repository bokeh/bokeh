import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export interface CenterRotatableData extends XYGlyphData {
  _angle: Arrayable<number>
  _width: Arrayable<number>
  _height: Arrayable<number>

  sw: Arrayable<number>
  sh: Arrayable<number>

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
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    angle: AngleSpec
    width: DistanceSpec
    height: DistanceSpec
  }

  export interface Props extends XYGlyph.Props {
    angle: p.AngleSpec
    width: p.DistanceSpec
    height: p.DistanceSpec
  }

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface CenterRotatable extends CenterRotatable.Attrs {}

export abstract class CenterRotatable extends XYGlyph {

  properties: CenterRotatable.Props

  constructor(attrs?: Partial<CenterRotatable.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CenterRotatable'

    this.mixins(['line', 'fill'])
    this.define({
      angle:  [ p.AngleSpec,   0     ],
      width:  [ p.DistanceSpec       ],
      height: [ p.DistanceSpec       ],
    })

  }
}
CenterRotatable.initClass()
