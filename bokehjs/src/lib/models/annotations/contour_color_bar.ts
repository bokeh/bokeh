import {BaseColorBar, BaseColorBarView} from "./base_color_bar"
import type {MultiLineView} from "../glyphs/multi_line"
import type {MultiPolygonsView} from "../glyphs/multi_polygons"
import type {Range} from "../ranges"
import {Range1d} from "../ranges"
import type {GlyphRendererView} from "../renderers/glyph_renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import type {BBox} from "core/util/bbox"
import type {Context2d} from "core/util/canvas"

export class ContourColorBarView extends BaseColorBarView {
  declare model: ContourColorBar

  protected _fill_view: GlyphRendererView
  protected _line_view: GlyphRendererView

  override *children(): IterViews {
    yield* super.children()
    yield this._fill_view
    yield this._line_view
  }

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

  override _create_major_range(): Range {
    const levels = this.model.levels
    if (levels.length > 0) {
      return new Range1d({start: levels[0], end: levels[levels.length-1]})
    } else {
      return new Range1d({start: 0, end: 1})
    }
  }

  protected _paint_colors(ctx: Context2d, bbox: BBox): void {
    const vertical = this.orientation == "vertical"
    const levels = this.model.levels
    const scale = this._major_scale
    scale.source_range = this._major_range
    if (vertical) {
      scale.target_range = new Range1d({start: bbox.bottom, end: bbox.top})
    } else {
      scale.target_range = new Range1d({start: bbox.left, end: bbox.right})
    }
    const scaled_levels = scale.v_compute(levels)

    const multi_polygons = this._fill_view.glyph as MultiPolygonsView
    const nfill = multi_polygons.data_size
    if (nfill > 0) {
      assert(levels.length == nfill+1, "Inconsistent number of filled contour levels")
      ctx.save()
      for (let i = 0; i < nfill; i++) {
        ctx.beginPath()
        if (vertical) {
          ctx.rect(bbox.left, scaled_levels[i], bbox.width, scaled_levels[i+1] - scaled_levels[i])
        } else {
          ctx.rect(scaled_levels[i], bbox.top, scaled_levels[i+1] - scaled_levels[i], bbox.height)
        }
        multi_polygons.visuals.fill.apply(ctx, i)
        multi_polygons.visuals.hatch.apply(ctx, i)
      }
      ctx.restore()
    }
    this._fill_view.force_finished() // MultiPolygonsView.paint() wasn't called

    const multi_line = this._line_view.glyph as MultiLineView
    const nline = multi_line.data_size
    if (nline > 0) {
      assert(levels.length == nline, "Inconsistent number of line contour levels")
      ctx.save()
      for (let i = 0; i < nline; i++) {
        ctx.beginPath()
        if (vertical) {
          ctx.moveTo(bbox.left, scaled_levels[i])
          ctx.lineTo(bbox.right, scaled_levels[i])
        } else {
          ctx.moveTo(scaled_levels[i], bbox.bottom)
          ctx.lineTo(scaled_levels[i], bbox.top)
        }
        multi_line.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
      ctx.restore()
    }
    this._line_view.force_finished() // MultiLineView.paint() wasn't called
  }
}

export namespace ContourColorBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseColorBar.Props & {
    fill_renderer: p.Property<GlyphRenderer>
    line_renderer: p.Property<GlyphRenderer>
    levels: p.Property<number[]>
  }
}

export interface ContourColorBar extends ContourColorBar.Attrs {}

export class ContourColorBar extends BaseColorBar {
  declare properties: ContourColorBar.Props
  declare __view_type__: ContourColorBarView

  constructor(attrs?: Partial<ContourColorBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ContourColorBarView

    this.define<ContourColorBar.Props>(({List, Float, Ref}) => ({
      fill_renderer: [ Ref(GlyphRenderer) ],
      line_renderer: [ Ref(GlyphRenderer) ],
      levels:        [ List(Float), [] ],
    }))
  }
}
