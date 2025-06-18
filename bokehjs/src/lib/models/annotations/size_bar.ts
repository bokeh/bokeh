import {BaseBar, BaseBarView} from "./base_bar"
import type {RadialGlyph, RadialGlyphView} from "../glyphs/radial_glyph"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {Context2d} from "core/util/canvas"
import type {BBox} from "core/util/bbox"
import type {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {range} from "core/util/array"
import type * as p from "core/properties"
import * as uniforms from "core/uniforms"

import {Plot} from "../plots/plot"

export class SizeBarView extends BaseBarView {
  declare model: SizeBar

  override initialize(): void {
    super.initialize()

    const size_bar = new Plot()
  }

  get glyph_view(): RadialGlyphView {
    const rv = this.plot_view.views.get_one(this.model.renderer)
    return rv.glyph_view as RadialGlyphView
  }

  protected override _create_major_range(): Range {
    const {glyph_view} = this
    const start = uniforms.min(glyph_view.radius)
    const end = uniforms.max(glyph_view.radius)
    return new Range1d({start, end})
  }

  protected override _paint_colors(ctx: Context2d, bbox: BBox): void {
    const {start, end} = this._major_range
    const ticks = this._ticker.get_ticks(start, end, this._major_range, 0 /*whatever*/)

    const indices = range(ticks.major.length)

    const {glyph_view} = this
    glyph_view.paint(ctx, indices, {})
  }

  protected _paint(_ctx: Context2d): void {}
}

export namespace SizeBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseBar.Props & {
    renderer: p.Property<GlyphRenderer<RadialGlyph>>
  }
}

export interface SizeBar extends SizeBar.Attrs {}

export class SizeBar extends BaseBar {
  declare properties: SizeBar.Props
  declare __view_type__: SizeBarView

  constructor(attrs?: Partial<SizeBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SizeBarView

    this.define<SizeBar.Props>(({Ref}) => ({
      renderer: [ Ref(GlyphRenderer) ],
    }))
  }
}
