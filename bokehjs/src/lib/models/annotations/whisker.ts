import {UpperLower, UpperLowerView} from "./upper_lower"
import {ArrowHead, TeeHead} from "./arrow_head"
import type {Context2d} from "core/util/canvas"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

import {WhiskerGlyph} from "../glyphs/whisker"
import {GlyphRenderer} from "../renderers/glyph_renderer"

export class WhiskerView extends UpperLowerView {
  declare model: Whisker
  declare visuals: Whisker.Visuals

  protected _renderer: GlyphRenderer<WhiskerGlyph>

  override initialize(): void {
    super.initialize()

    this._renderer = new GlyphRenderer({
      glyph: new WhiskerGlyph(),
      auto_ranging: "none",
    })
    this._update_props()

    this._computed_renderers.push(this._renderer)
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this._update_props())
  }

  protected _update_props(): void {
    this._renderer.setv<GlyphRenderer.Attrs<WhiskerGlyph>>({
      data_source: this.model.source,
      level: this.model.level,
    })
    this._renderer.glyph.setv<WhiskerGlyph.Attrs>({
      dimension: this.model.dimension,
      lower: this.model.lower,
      upper: this.model.upper,
      base: this.model.base,
      lower_head: this.model.lower_head,
      upper_head: this.model.upper_head,
      ...mixins.attrs_of(this.model, "", mixins.LineVector),
    })
  }

  _paint(_ctx: Context2d): void {}
}

export namespace Whisker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UpperLower.Props & {
    lower_head: p.Property<ArrowHead | null>
    upper_head: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = mixins.LineVector

  export type Visuals = UpperLower.Visuals & {line: visuals.LineVector}
}

export interface Whisker extends Whisker.Attrs {}

export class Whisker extends UpperLower {
  declare properties: Whisker.Props
  declare __view_type__: WhiskerView

  constructor(attrs?: Partial<Whisker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WhiskerView

    this.mixins<Whisker.Mixins>(mixins.LineVector)

    this.define<Whisker.Props>(({Ref, Nullable}) => ({
      lower_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
      upper_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
    }))

    this.override<Whisker.Props>({
      level: "underlay",
    })
  }
}
