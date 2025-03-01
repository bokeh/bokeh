import {Annotation, AnnotationView} from "./annotation"
import {ArrowHead, OpenHead} from "./arrow_head"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import type {Context2d} from "core/util/canvas"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import {CoordinateUnits} from "core/enums"
import type {View, ViewOf} from "core/build_views"
import {build_view} from "core/build_views"
import * as p from "core/properties"

import {ArrowGlyph} from "../glyphs/arrow"
import {GlyphRenderer} from "../renderers/glyph_renderer"

export class ArrowView extends AnnotationView {
  declare model: Arrow
  declare visuals: Arrow.Visuals

  protected _renderer: GlyphRenderer<ArrowGlyph>
  protected _renderer_view: ViewOf<GlyphRenderer<ArrowGlyph>>

  override children_views(): View[] {
    return [...super.children_views(), this._renderer_view]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this._renderer = new GlyphRenderer({
      data_source: this.model.source,
      glyph: new ArrowGlyph({
        x0: this.model.x_start,
        y0: this.model.y_start,
        x1: this.model.x_end,
        y1: this.model.y_end,
        start: this.model.start,
        end: this.model.end,
        ...mixins.attrs_of(this.model, "", mixins.LineVector),
      }),
      auto_ranging: "none",
      level: "annotation",
    })
    this._renderer_view = await build_view(this._renderer, {parent: this.plot_view})
  }

  override remove(): void {
    this._renderer_view.remove()
    super.remove()
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
