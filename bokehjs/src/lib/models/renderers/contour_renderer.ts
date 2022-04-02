import {DataRenderer, DataRendererView} from "./data_renderer"
import {GlyphRenderer, GlyphRendererView} from "./glyph_renderer"
import {Renderer} from "./renderer"
import {GlyphView} from "../glyphs/glyph"
import {ColorMapper} from "../mappers/color_mapper"
import {Ticker} from "../tickers/ticker"
import * as p from "core/properties"
import {build_view} from "core/build_views"
import {SelectionManager} from "core/selection_manager"

export class ContourRendererView extends DataRendererView {
  override model: ContourRenderer

  fill_view: GlyphRendererView
  line_view: GlyphRendererView

  get glyph_view(): GlyphView {
    return this.fill_view.glyph
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {parent} = this
    const {fill_renderer, line_renderer} = this.model
    this.fill_view = await build_view(fill_renderer, {parent})
    this.line_view = await build_view(line_renderer, {parent})
  }

  override remove(): void {
    this.fill_view.remove()
    this.line_view.remove()
    super.remove()
  }

  protected _render(): void {
    this.fill_view.render()
    this.line_view.render()
  }

  override renderer_view<T extends Renderer>(renderer: T): T["__view_type__"] | undefined {
    if (renderer instanceof GlyphRenderer) {
      if (renderer == this.fill_view.model)
        return this.fill_view
      if (renderer == this.line_view.model)
        return this.line_view
    }
    return super.renderer_view(renderer)
  }
}

export namespace ContourRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRenderer.Props & {
    fill_renderer: p.Property<GlyphRenderer>
    line_renderer: p.Property<GlyphRenderer>
    data: p.Property<{[key: string]: any}>
  }
}

export interface ContourRenderer extends ContourRenderer.Attrs {}

export class ContourRenderer extends DataRenderer {
  override properties: ContourRenderer.Props
  override __view_type__: ContourRendererView

  constructor(attrs?: Partial<ContourRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ContourRendererView

    this.define<ContourRenderer.Props>(({Any, Dict, Ref}) => ({
      fill_renderer: [ Ref(GlyphRenderer) ],
      line_renderer: [ Ref(GlyphRenderer) ],
      data:          [ Dict(Any), {} ],
      ticker:        [ Ref(Ticker) ],
      color_mapper:  [ Ref(ColorMapper) ],
    }))
  }

  get_selection_manager(): SelectionManager {
    return this.fill_renderer.data_source.selection_manager
  }
}
