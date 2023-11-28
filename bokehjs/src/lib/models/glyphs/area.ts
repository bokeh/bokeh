import {Glyph, GlyphView} from "./glyph"
import {generic_area_scalar_legend} from "./utils"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import type {Context2d} from "core/util/canvas"
import type * as p from "core/properties"
import * as mixins from "core/property_mixins"

export interface AreaView extends Area.Data {}

export abstract class AreaView extends GlyphView {
  declare model: Area
  declare visuals: Area.Visuals

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = mixins.FillScalar & mixins.HatchScalar

  export type Visuals = Glyph.Visuals & {fill: visuals.FillScalar, hatch: visuals.HatchScalar}

  export type Data = p.GlyphDataOf<Props>
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  declare properties: Area.Props
  declare __view_type__: AreaView

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<Area.Mixins>([mixins.FillScalar, mixins.HatchScalar])
  }
}
