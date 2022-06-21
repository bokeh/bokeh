import {BaseColorBar, BaseColorBarView} from "./base_color_bar"
import {MultiLineView} from "../glyphs/multi_line"
import {MultiPolygonsView} from "../glyphs/multi_polygons"
import {GlyphRenderer, GlyphRendererView} from "../renderers/glyph_renderer"
import {build_view} from "core/build_views"
import * as p from "core/properties"
import {BBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export class ContourColorBarView extends BaseColorBarView {
  override model: ContourColorBar

  protected _fill_view: GlyphRendererView
  protected _line_view: GlyphRendererView

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {fill_renderer, line_renderer} = this.model
    this._fill_view = await build_view(fill_renderer, {parent: this.parent})
    this._line_view = await build_view(line_renderer, {parent: this.parent})
  }

  override remove(): void {
    this._fill_view.remove()
    this._line_view.remove()
    super.remove()
  }

  protected _paint_colors(ctx: Context2d, bbox: BBox): void {
    // Need to check this might be null
    const multi_polygons = this._fill_view.glyph as MultiPolygonsView
    ctx.save()
    const nfill = multi_polygons.data_size
    console.log(nfill)
    for (let i = 0; i < nfill; i++) {
      ctx.beginPath()
      ctx.rect(bbox.left, bbox.bottom - bbox.height*i/nfill, bbox.width, -bbox.height/nfill)
      multi_polygons.visuals.fill.apply(ctx, i)
      multi_polygons.visuals.hatch.apply(ctx, i)
    }
    ctx.restore()

    // Need to check this might be null
    const multi_line = this._line_view.glyph as MultiLineView
    ctx.save()
    const nlines = multi_line.data_size
    for (let i = 0; i < nlines; i++) {
      const y = bbox.bottom - bbox.height*i / (nlines-1)
      ctx.beginPath()
      ctx.moveTo(bbox.left, y)
      ctx.lineTo(bbox.right, y)
      multi_line.visuals.line.set_vectorize(ctx, i)
      ctx.stroke()
    }
    ctx.restore()
  }
}

export namespace ContourColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseColorBar.Props & {
    fill_renderer: p.Property<GlyphRenderer>
    line_renderer: p.Property<GlyphRenderer>
  }
}

export interface ContourColorBar extends ContourColorBar.Attrs {}

export class ContourColorBar extends BaseColorBar {
  override properties: ContourColorBar.Props
  override __view_type__: ContourColorBarView

  constructor(attrs?: Partial<ContourColorBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ContourColorBarView

    this.define<ContourColorBar.Props>(({Ref}) => ({
      fill_renderer: [ Ref(GlyphRenderer) ],
      line_renderer: [ Ref(GlyphRenderer) ],
    }))
  }
}
