import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_scalar_legend} from "./utils"
import * as visuals from "core/visuals"
import {Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"

export interface AreaData extends GlyphData {}

export interface AreaView extends AreaData {}

export abstract class AreaView extends GlyphView {
  model: Area
  visuals: Area.Visuals

  draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = mixins.Fill/*Scalar*/ & mixins.Hatch/*Scalar*/

  export type Visuals = Glyph.Visuals & {fill: visuals.Fill/*Scalar*/, hatch: visuals.Hatch/*Scalar*/}
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  properties: Area.Props
  __view_type__: AreaView

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static init_Area(): void {
    this.mixins<Area.Mixins>([mixins.Fill/*Scalar*/, mixins.Hatch/*Scalar*/])
  }
}
