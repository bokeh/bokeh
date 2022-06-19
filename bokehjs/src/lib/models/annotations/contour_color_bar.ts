import {build_view} from "core/build_views"
import * as p from "core/properties"
import {BBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"
import {ColorBar, ColorBarView} from "./color_bar"

import {GlyphRenderer, GlyphRendererView} from "../renderers/glyph_renderer"
import {MultiLineView} from "../glyphs/multi_line"
import {MultiPolygonsView} from "../glyphs/multi_polygons"

export class ContourColorBarView extends ColorBarView {
  override model: ContourColorBar
  //override visuals: ContourColorBar.Visuals

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

  //override connect_signals(): void {
  //  super.connect_signals()
  //}

  protected _paint_impl(ctx: Context2d, bbox: BBox): void {
    console.log("_paint_impl", ctx, bbox)
    //const {x, y, width, height} = bbox
    //console.log("ticker", this._ticker)

    // Need to check this first
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

    // Need to check this first
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

  protected override _render(): void {
    // From parent...
    const {ctx} = this.layer
    ctx.save()
    this._paint_bbox(ctx, this._inner_layout.bbox)

    //this._paint_image(ctx, this._inner_layout.center_panel.bbox)
    this._paint_impl(ctx, this._inner_layout.center_panel.bbox)

    this._title_view.render()
    this._axis_view.render()
    ctx.restore()
  }

  /*override serializable_state(): SerializableState {
    const {children = [], ...state} = super.serializable_state()
    children.push(this._title_view.serializable_state())
    children.push(this._axis_view.serializable_state())
    return {...state, children}
  }*/
}

export namespace ContourColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorBar.Props & {
    fill_renderer: p.Property<GlyphRenderer>
    line_renderer: p.Property<GlyphRenderer>
  }
}

export interface ContourColorBar extends ContourColorBar.Attrs {}

export class ContourColorBar extends ColorBar {
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
