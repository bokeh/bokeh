import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import type {Indices} from "core/types"
import type {Context2d} from "core/util/canvas"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import type {GlyphView} from "../glyphs/glyph"
import type {RendererView} from "../renderers/renderer"
import type {PathDecorationView} from "./decoration"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {dist_to_segment, point_in_poly} from "core/hittest"

export type MarkingGeometry = {
  type: "polyline" | "polygon"
  x: number[]
  y: number[]
}

export abstract class MarkingView extends DOMComponentView implements visuals.Paintable {
  declare model: Marking
  visuals: Marking.Visuals
  declare readonly parent: RendererView | PathDecorationView

  size: p.Uniform<number>

  private _source?: ColumnarDataSource
  private _indices?: Indices

  override initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      if (this._source != null && this._indices != null) {
        this.set_data(this._source, this._indices)
      }
      this.request_paint()
    })
  }

  request_paint(): void {
    this.parent.request_paint()
  }

  get canvas() {
    return this.parent.canvas
  }

  /** The distance from the marking's anchor to its rear edge along a line. */
  line_extent(_i: number): number {
    return 0
  }

  hit_geometry(_i: number): MarkingGeometry | null {
    return null
  }

  contains(x: number, y: number, i: number): boolean {
    const geometry = this.hit_geometry(i)
    if (geometry == null) {
      return false
    }

    const {type, x: xs, y: ys} = geometry
    if (xs.length == 0 || ys.length == 0) {
      return false
    }
    if (type == "polygon" && point_in_poly(x, y, xs, ys)) {
      return true
    }

    const point = {x, y}
    const n = type == "polygon" ? xs.length : xs.length - 1
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % xs.length
      if (dist_to_segment(point, {x: xs[j], y: ys[j]}, {x: xs[k], y: ys[k]}) <= 2) {
        return true
      }
    }
    return false
  }

  set_data(source: ColumnarDataSource, indices: Indices): void {
    this._source = source
    this._indices = indices
    const self = this as any
    for (const prop of this.model) {
      if (!(prop instanceof p.VectorSpec || prop instanceof p.ScalarSpec)) {
        continue
      }
      const uniform = prop.uniform(source).select(indices)
      self[`${prop.attr}`] = uniform
    }
  }

  inherit_from(host: GlyphView): void {
    for (const attr of this.model.inherit_visuals) {
      const source_attr = attr == "fill_color" ? "line_color" : attr == "fill_alpha" ? "line_alpha" : attr
      const uniform = (host as any)[source_attr]
      if (uniform != null && attr in this.model.properties) {
        ;(this as any)[attr] = uniform
      }
    }
  }

  abstract paint(ctx: Context2d, i: number): void
}

export namespace Marking {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    inherit_visuals: p.Property<string[]>
  }

  export type Visuals = visuals.Visuals
}

export interface Marking extends Marking.Attrs {}

export abstract class Marking extends Model {
  declare properties: Marking.Props
  declare __view_type__: MarkingView

  static {
    this.define<Marking.Props>(({List, Enum}) => ({
      inherit_visuals: [ List(Enum("line_color", "line_alpha", "line_width", "line_join", "line_cap",
        "line_dash", "line_dash_offset", "fill_color", "fill_alpha")), [] ],
    }))
  }
}
