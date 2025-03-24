import {Annotation, AnnotationView} from "./annotation"
import {ArrowHead, OpenHead} from "./arrow_head"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import type {Context2d} from "core/util/canvas"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import * as p from "core/properties"

import {ArrowGlyph} from "../glyphs/arrow"
import {GlyphRenderer} from "../renderers/glyph_renderer"

export class ArrowView extends AnnotationView {
  declare model: Arrow
  declare visuals: Arrow.Visuals

  protected _renderer: GlyphRenderer<ArrowGlyph>

  override initialize(): void {
    super.initialize()

    this._renderer = new GlyphRenderer({
      glyph: new ArrowGlyph(),
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
    this._renderer.setv<GlyphRenderer.Attrs<ArrowGlyph>>({
      data_source: this.model.source,
      level: this.model.level,
    })
    this._renderer.glyph.setv<ArrowGlyph.Attrs>({
      x0: this.model.x_start,
      y0: this.model.y_start,
      x1: this.model.x_end,
      y1: this.model.y_end,
      start: this.model.start,
      end: this.model.end,
      ...mixins.attrs_of(this.model, "", mixins.LineVector),
    })

    const update_scales = (units: CoordinateUnits, x: p.CoordinateSpec, y: p.CoordinateSpec) => {
      switch (units) {
        case "data": {
          x.scale_override = null
          y.scale_override = null
          break
        }
        case "canvas": {
          const {canvas} = this.plot_view
          x.scale_override = canvas.bbox.x_screen
          y.scale_override = canvas.bbox.y_screen
          break
        }
        case "screen": {
          const {frame} = this.plot_view
          x.scale_override = frame.bbox.x_view
          y.scale_override = frame.bbox.y_view
          break
        }
      }
    }

    const {x0, y0, x1, y1} = this._renderer.glyph.properties
    update_scales(this.model.start_units, x0, y0)
    update_scales(this.model.end_units, x1, y1)
  }

  _paint(_ctx: Context2d): void {}
}

export namespace Arrow {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    source: p.Property<ColumnarDataSource>
    x_start: p.XCoordinateSpec
    y_start: p.YCoordinateSpec
    start_units: p.Property<CoordinateUnits>
    start: p.Property<ArrowHead | null>
    x_end: p.XCoordinateSpec
    y_end: p.YCoordinateSpec
    end_units: p.Property<CoordinateUnits>
    end: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = mixins.LineVector

  export type Visuals = Annotation.Visuals & {line: visuals.LineVector}
}

export interface Arrow extends Arrow.Attrs {}

export class Arrow extends Annotation {
  declare properties: Arrow.Props
  declare __view_type__: ArrowView

  constructor(attrs?: Partial<Arrow.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ArrowView

    this.mixins<Arrow.Mixins>(mixins.LineVector)

    this.define<Arrow.Props>(({Ref, Nullable}) => ({
      source:      [ Ref(ColumnarDataSource), () => new ColumnDataSource() ],
      x_start:     [ p.XCoordinateSpec, {field: "x_start"} ],
      y_start:     [ p.YCoordinateSpec, {field: "y_start"} ],
      start_units: [ CoordinateUnits, "data" ],
      start:       [ Nullable(Ref(ArrowHead)), null ],
      x_end:       [ p.XCoordinateSpec, {field: "x_end"} ],
      y_end:       [ p.YCoordinateSpec, {field: "y_end"} ],
      end_units:   [ CoordinateUnits, "data" ],
      end:         [ Nullable(Ref(ArrowHead)), () => new OpenHead() ],
    }))
  }
}
