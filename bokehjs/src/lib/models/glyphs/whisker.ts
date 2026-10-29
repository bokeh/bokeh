import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import type {ArrowHeadView} from "../annotations/arrow_head"
import {ArrowHead, TeeHead} from "../annotations/arrow_head"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Arrayable, Indices, Rect} from "core/types"
import {Dimension} from "core/enums"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"

const {PI} = Math

export interface WhiskerGlyphView extends WhiskerGlyph.Data {}

export class WhiskerGlyphView extends GlyphView {
  declare model: WhiskerGlyph
  declare visuals: WhiskerGlyph.Visuals

  protected lower_head: ArrowHeadView | null = null
  protected upper_head: ArrowHeadView | null = null

  override _children_views(): ChildView[] {
    return [...super._children_views(), this.lower_head, this.upper_head]
  }

  protected async _build_head(head: ArrowHead | null): Promise<ArrowHeadView | null> {
    return head != null ? await build_view(head, {parent: this}) : null
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.lower_head = await this._build_head(this.model.lower_head)
    this.upper_head = await this._build_head(this.model.upper_head)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {lower_head, upper_head} = this.model.properties
    this.connect(lower_head.change, async () => {
      this.lower_head?.remove()
      this.lower_head = await this._build_head(this.model.lower_head)
      this._set_heads_data()
      this.request_paint()
    })
    this.connect(upper_head.change, async () => {
      this.upper_head?.remove()
      this.upper_head = await this._build_head(this.model.upper_head)
      this._set_heads_data()
      this.request_paint()
    })
  }

  protected _set_heads_data(): void {
    if (this.is_destroyed) {
      return
    }
    const source = this.renderer.model.data_source
    const {indices} = this.renderer.model.view
    this.lower_head?.set_data(source, indices)
    this.upper_head?.set_data(source, indices)
  }

  override async set_data(source: ColumnarDataSource, indices: Indices, indices_to_update?: number[]): Promise<void> {
    await super.set_data(source, indices, indices_to_update)
    this.lower_head?.set_data(source, indices)
    this.upper_head?.set_data(source, indices)
  }

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this
    const {dimension} = this.model

    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]
    const lower = [this.lower, this.base]
    const upper = [this.upper, this.base]

    const lower_x = lower[i]
    const lower_y = lower[j]
    const upper_x = upper[i]
    const upper_y = upper[j]

    for (let k = 0; k < data_size; k++) {
      const x0 = lower_x[k]
      const y0 = lower_y[k]
      const x1 = upper_x[k]
      const y1 = upper_y[k]
      index.add_rect(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
    }
  }

  protected override _map_data(): void {
    const {dimension} = this.model
    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]

    const slower = [this.slower, this.sbase]
    const supper = [this.supper, this.sbase]

    this._define_attr<WhiskerGlyph.Data>("lower_sx", slower[i])
    this._define_attr<WhiskerGlyph.Data>("lower_sy", slower[j])
    this._define_attr<WhiskerGlyph.Data>("upper_sx", supper[i])
    this._define_attr<WhiskerGlyph.Data>("upper_sy", supper[j])
  }

  scenterxy(i: number): [number, number] {
    const sx = (this.lower_sx[i] + this.upper_sx[i])/2
    const sy = (this.lower_sy[i] + this.upper_sy[i])/2
    return [sx, sy]
  }

  protected _paint(ctx: Context2d, indices: Int32Array, data?: Partial<WhiskerGlyph.Data>): void {
    const {lower_sx, lower_sy, upper_sx, upper_sy} = {...this, ...data}
    const {lower_head, upper_head} = this
    const angle = this.model.dimension == "height" ? 0 : PI/2

    if (this.visuals.line.doit) {
      for (const i of indices) {
        ctx.beginPath()
        ctx.moveTo(lower_sx[i], lower_sy[i])
        ctx.lineTo(upper_sx[i], upper_sy[i])
        this.visuals.line.apply(ctx, i)
      }
    }

    const paint_head = (head: ArrowHeadView, sx: Arrayable<number>, sy: Arrayable<number>, angle: number) => {
      for (const i of indices) {
        ctx.save()
        ctx.translate(sx[i], sy[i])
        ctx.rotate(angle)
        head.paint(ctx, i)
        ctx.restore()
      }
    }

    if (lower_head != null) {
      paint_head(lower_head, lower_sx, lower_sy, angle + PI)
    }
    if (upper_head != null) {
      paint_head(upper_head, upper_sx, upper_sy, angle)
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace WhiskerGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    dimension: p.Property<Dimension>
    lower: p.XOrYCoordinateSpec
    upper: p.XOrYCoordinateSpec
    base: p.XOrYCrossCoordinateSpec
    lower_head: p.Property<ArrowHead | null>
    upper_head: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props> & {
    readonly lower_sx: Arrayable<number>
    readonly lower_sy: Arrayable<number>
    readonly upper_sx: Arrayable<number>
    readonly upper_sy: Arrayable<number>
  }
}

export interface WhiskerGlyph extends WhiskerGlyph.Attrs {}

export class WhiskerGlyph extends Glyph {
  declare properties: WhiskerGlyph.Props
  declare __view_type__: WhiskerGlyphView

  static {
    this.prototype.default_view = WhiskerGlyphView

    this.mixins<WhiskerGlyph.Mixins>(LineVector)

    this.define<WhiskerGlyph.Props>(({Ref, Nullable}) => ({
      dimension:  [ Dimension, "height" ],
      lower:      [ p.XOrYCoordinateSpec, {field: "lower"} ],
      upper:      [ p.XOrYCoordinateSpec, {field: "upper"} ],
      base:       [ p.XOrYCrossCoordinateSpec, {field: "base"} ],
      lower_head: [ Nullable(Ref(ArrowHead)), () => TeeHead.create({size: 10}) ],
      upper_head: [ Nullable(Ref(ArrowHead)), () => TeeHead.create({size: 10}) ],
    }))
  }
}
