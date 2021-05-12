import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_scalar_legend} from "./utils"
import * as visuals from "core/visuals"
import {Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"

export type AreaData = GlyphData & p.UniformsOf<Area.Mixins>

export interface AreaView extends AreaData {}

export abstract class AreaView extends GlyphView {
  override model: Area
  override visuals: Area.Visuals

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = mixins.FillScalar & mixins.HatchScalar

  export type Visuals = Glyph.Visuals & {fill: visuals.FillScalar, hatch: visuals.HatchScalar}
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  override properties: Area.Props
  override __view_type__: AreaView

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static init_Area(): void {
    this.mixins<Area.Mixins>([mixins.FillScalar, mixins.HatchScalar])
  }
}
