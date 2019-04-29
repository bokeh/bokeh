import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {LineVector, FillVector} from "core/property_mixins"
import {Fill} from "core/visuals"
import {Area as BBoxArea } from "core/types"
import {Context2d} from "core/util/canvas"
import * as p from "core/properties"

export interface AreaData extends GlyphData {}

export interface AreaView extends AreaData {}

export abstract class AreaView extends GlyphView {
  model:Area
  visuals: Area.Visuals

  draw_legend_for_index(ctx: Context2d, bbox: BBoxArea, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & LineVector & FillVector

  export type Visuals = Glyph.Visuals & {fill: Fill}
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  properties: Area.Props

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Area'

    this.mixins(['fill'])
  }
}
Area.initClass()
