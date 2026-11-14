import {DataRenderer, DataRendererView} from "./data_renderer"
import type {GlyphRendererView} from "./glyph_renderer"
import {ContourLabels} from "./contour_labels"
import {GlyphRenderer} from "./glyph_renderer"
import type {GlyphView} from "../glyphs/glyph"
import type * as p from "core/properties"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import type {SelectionManager} from "core/selection_manager"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {Context2d} from "core/util/canvas"

type ContourLabelOptions = Omit<Partial<ContourLabels.Attrs>, "text">

export class ContourRendererView extends DataRendererView {
  declare model: ContourRenderer

  fill_view: GlyphRendererView
  line_view: GlyphRendererView

  override _children_views(): ChildView[] {
    return [...super._children_views(), this.fill_view, this.line_view]
  }

  get glyph_view(): GlyphView {
    if (this.fill_view.glyph.data_size > 0) {
      return this.fill_view.glyph
    } else {
      return this.line_view.glyph
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {fill_renderer, line_renderer} = this.model
    this.fill_view = await build_view(fill_renderer, {parent: this})
    this.line_view = await build_view(line_renderer, {parent: this})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
  }

  override get has_webgl(): boolean {
    return (this.fill_view.displayed && this.fill_view.has_webgl) || (this.line_view.displayed && this.line_view.has_webgl)
  }

  protected _paint(ctx: Context2d): void {
    this.fill_view.paint(ctx)
    this.line_view.paint(ctx)
  }

  hit_test(geometry: Geometry): HitTestResult {
    return this.fill_view.hit_test(geometry)
  }
}

export namespace ContourRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRenderer.Props & {
    fill_renderer: p.Property<GlyphRenderer>
    line_renderer: p.Property<GlyphRenderer>
    levels: p.Property<number[]>
  }
}

export interface ContourRenderer extends ContourRenderer.Attrs {}

export class ContourRenderer extends DataRenderer {
  declare properties: ContourRenderer.Props
  declare __view_type__: ContourRendererView

  static {
    this.prototype.default_view = ContourRendererView

    this.define<ContourRenderer.Props>(({List, Float, Ref}) => ({
      fill_renderer: [ Ref(GlyphRenderer) ],
      line_renderer: [ Ref(GlyphRenderer) ],
      levels:        [ List(Float), [] ],
    }))
  }

  /** Label the current levels by default, or use the supplied text spec. */
  add_labels(text: ContourLabels.Attrs["text"] = null, options: ContourLabelOptions = {}): ContourLabels {
    const labels = ContourLabels.create({
      background_fill_color: options.inline_gap === true ? null : "white",
      ...options,
      text,
    })
    const {line_renderer} = this
    line_renderer.attachments = [...line_renderer.attachments, labels]
    return labels
  }

  get_selection_manager(): SelectionManager {
    return this.fill_renderer.data_source.selection_manager
  }
}
