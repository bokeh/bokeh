import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Fill, Hatch} from "core/visuals"
import {Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import * as p from "core/properties"

export interface AreaData extends GlyphData {}

export interface AreaView extends AreaData {}

export abstract class AreaView extends GlyphView {
  model: Area
  visuals: Area.Visuals

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {fill: Fill, hatch: Hatch}
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  properties: Area.Props

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static init_Area(): void {
    this.mixins<Area.Mixins>([LineVector, FillVector, HatchVector])
  }
}
