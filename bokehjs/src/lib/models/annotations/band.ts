import {UpperLower, UpperLowerView} from "./upper_lower"
import type {Context2d} from "core/util/canvas"
import type {IterViews, ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

import {BandGlyph} from "../glyphs/band"
import {GlyphRenderer} from "../renderers/glyph_renderer"

export class BandView extends UpperLowerView {
  declare model: Band
  declare visuals: Band.Visuals

  protected _renderer: GlyphRenderer<BandGlyph>
  protected _renderer_view: ViewOf<GlyphRenderer<BandGlyph>>

  override *children(): IterViews {
    yield* super.children()
    yield this._renderer_view
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this._renderer = new GlyphRenderer({
      data_source: this.model.source,
      glyph: new BandGlyph({
        dimension: this.model.dimension,
        lower: this.model.lower,
        upper: this.model.upper,
        base: this.model.base,
        ...mixins.attrs_of(this.model, "", mixins.LineVector),
        ...mixins.attrs_of(this.model, "", mixins.FillVector),
        ...mixins.attrs_of(this.model, "", mixins.HatchVector),
      }),
      auto_ranging: "none",
      level: "annotation",
    })
    this._renderer_view = await build_view(this._renderer, {parent: this.plot_view})
  }

  _paint(_ctx: Context2d): void {}
}

export namespace Band {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & Mixins

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = UpperLower.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
}

export interface Band extends Band.Attrs {}

export class Band extends UpperLower {
  declare properties: Band.Props
  declare __view_type__: BandView

  constructor(attrs?: Partial<Band.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BandView

    this.mixins<Band.Mixins>([mixins.Line, mixins.Fill, mixins.Hatch])

    this.override<Band.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
