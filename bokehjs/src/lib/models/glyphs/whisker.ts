import {Glyph, GlyphView} from "./glyph"
import type {ArrowHeadView} from "../annotations/arrow_head"
import {ArrowHead, TeeHead} from "../annotations/arrow_head"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Indices} from "core/types"
import type {Arrayable} from "core/types"
import {Dimension} from "core/enums"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import type {IterViews} from "core/build_views"
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

  override *children(): IterViews {
    yield* super.children()

    const {lower_head, upper_head} = this
    if (lower_head != null) {
      yield lower_head
    }
    if (upper_head != null) {
      yield upper_head
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {lower_head, upper_head} = this.model
    if (lower_head != null) {
      this.lower_head = await build_view(lower_head, {parent: this.parent})
    }
    if (upper_head != null) {
      this.upper_head = await build_view(upper_head, {parent: this.parent})
    }
  }

  override remove(): void {
    this.lower_head?.remove()
    this.upper_head?.remove()
    super.remove()
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this
    const {dimension} = this.model

    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]
    const lower = [this.lower, this.base]
    const upper = [this.upper, this.base]

    const lower_x = lower[i]
    const lower_y = lower[j]

    const upper_x = upper[i]
    const upper_y = upper[j]

    for (let i = 0; i < data_size; i++) {
      const x0 = lower_x[i]
      const y0 = lower_y[i]
      const x1 = upper_x[i]
      const y1 = upper_y[i]
      index.add_rect(x0, y0, x1, y1)
    }
  }

  scenterxy(_i: number): [number, number] {
    return [NaN, NaN] // TODO
  }

  override async set_data(source: ColumnarDataSource, indices: Indices, indices_to_update?: number[]): Promise<void> {
    await super.set_data(source, indices, indices_to_update)
    this.lower_head?.set_data(source, indices)
    this.upper_head?.set_data(source, indices)
  }

  override _map_data(): void {
    super._map_data()

    const {dimension} = this.model
    const [i, j] = dimension == "width" ? [0, 1] : [1, 0]

    const slower = [this.slower, this.sbase]
    const supper = [this.supper, this.sbase]

    this._define_attr<WhiskerGlyph.Data>("lower_sx", slower[i])
    this._define_attr<WhiskerGlyph.Data>("lower_sy", slower[j])

    this._define_attr<WhiskerGlyph.Data>("upper_sx", supper[i])
    this._define_attr<WhiskerGlyph.Data>("upper_sy", supper[j])
  }

  protected _paint(ctx: Context2d, indices: number[], data?: WhiskerGlyph.Data): void {
    const {lower_sx, upper_sx, lower_sy, upper_sy} = {...this, ...data}
    const {lower_head, upper_head} = this
    const {dimension} = this.model

    for (const i of indices) {
      const lower_sxi = lower_sx[i]
      const lower_syi = lower_sy[i]
      const upper_sxi = upper_sx[i]
      const upper_syi = upper_sy[i]

      if (!isFinite(lower_sxi + lower_syi + upper_sxi + upper_syi)) {
        continue
      }

      const angle = dimension == "height" ? 0 : PI/2

      if (lower_head != null) {
        ctx.translate(lower_sxi, lower_syi)
        ctx.rotate(angle + PI)
        lower_head.paint(ctx, i)
        ctx.rotate(-angle - PI)
        ctx.translate(-lower_sxi, -lower_syi)
      }

      if (upper_head != null) {
        ctx.translate(upper_sxi, upper_syi)
        ctx.rotate(angle)
        upper_head.paint(ctx, i)
        ctx.rotate(-angle)
        ctx.translate(-upper_sxi, -upper_syi)
      }

      if (!this.visuals.line.doit) {
        continue
      }

      if (lower_head != null || upper_head != null) {
        const {x, y, width, height} = this.renderer.plot_view.frame.bbox

        ctx.beginPath()
        ctx.rect(x, y, width, height)

        if (lower_head != null) {
          ctx.translate(lower_sxi, lower_syi)
          ctx.rotate(angle + PI)
          lower_head.clip(ctx, i)
          ctx.rotate(-angle - PI)
          ctx.translate(-lower_sxi, -lower_syi)
        }

        if (upper_head != null) {
          ctx.translate(upper_sxi, upper_syi)
          ctx.rotate(angle)
          upper_head.clip(ctx, i)
          ctx.rotate(-angle)
          ctx.translate(-upper_sxi, -upper_syi)
        }

        ctx.closePath()
        ctx.clip()
      }

      ctx.beginPath()
      ctx.moveTo(lower_sxi, lower_syi)
      ctx.lineTo(upper_sxi, upper_syi)
      this.visuals.line.apply(ctx, i)
    }
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

  constructor(attrs?: Partial<WhiskerGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WhiskerGlyphView

    this.mixins<WhiskerGlyph.Mixins>(LineVector)

    this.define<WhiskerGlyph.Props>(({Ref, Nullable}) => ({
      dimension:  [ Dimension, "height" ],
      lower:      [ p.XOrYCoordinateSpec, {field: "lower"} ],
      upper:      [ p.XOrYCoordinateSpec, {field: "upper"} ],
      base:       [ p.XOrYCrossCoordinateSpec, {field: "base"} ],
      lower_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
      upper_head: [ Nullable(Ref(ArrowHead)), () => new TeeHead({size: 10}) ],
    }))
  }
}
