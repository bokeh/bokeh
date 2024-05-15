import {TextBase, TextBaseView} from "./text_base"
import type {PointGeometry} from "core/geometry"
import type * as p from "core/properties"
import {UniformScalar, UniformVector} from "core/uniforms"
import type {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import type {XY, LRTB, Corners} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {enumerate} from "core/util/iterator"
import type {Rect} from "core/util/affine"
import {rotate_around, AffineTransform} from "core/util/affine"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import {OutlineShapeSpec} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"
import type {VectorVisuals} from "./defs"
import {sqrt, PI} from "core/util/math"
import type {OutlineShapeName} from "core/enums"

export interface TextView extends Text.Data {}

export class TextView extends TextBaseView {
  declare model: Text
  declare visuals: Text.Visuals

  protected async _build_labels(text: p.Uniform<string | null>): Promise<(GraphicsBox | null)[]> {
    return Array.from(text, (value) => {
      if (value == null) {
        return null
      } else {
        const text = `${value}` // TODO: guarantee correct types earlier
        return new TextBox({text})
      }
    })
  }

  override async _set_lazy_data(): Promise<void> {
    if (this.inherited_text) {
      this._inherit_attr<Text.Data>("labels")
    } else {
      this._define_attr<Text.Data>("labels", await this._build_labels(this.text))
    }
  }

  override after_visuals(): void {
    super.after_visuals()

    const n = this.data_size
    const {anchor} = this.base_glyph ?? this
    const {padding, border_radius} = this.model

    const {text_align, text_baseline} = this.visuals.text
    if (anchor.is_Scalar() && anchor.value != "auto") {
      this.anchor_ = new UniformScalar(resolve.anchor(anchor.value), n)
    } else if (anchor.is_Scalar() && text_align.is_Scalar() && text_baseline.is_Scalar()) {
      this.anchor_ = new UniformScalar(resolve.text_anchor(anchor.value, text_align.value, text_baseline.value), n)
    } else {
      const anchors: XY<number>[] = new Array(n)
      for (let i = 0; i < n; i++) {
        const anchor_i = anchor.get(i)
        const align_i = text_align.get(i)
        const baseline_i = text_baseline.get(i)
        anchors[i] = resolve.text_anchor(anchor_i, align_i, baseline_i)
      }
      this.anchor_ = new UniformVector(anchors)
    }

    this.padding = resolve.padding(padding)
    this.border_radius = resolve.border_radius(border_radius)

    this.swidth = new Float32Array(n)
    this.sheight = new Float32Array(n)

    const {left, right, top, bottom} = this.padding

    for (const [label, i] of enumerate(this.labels)) {
      if (label == null) {
        continue
      }

      label.visuals = this.visuals.text.values(i)
      label.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
      label.align = "auto"

      const size = label.size()
      const width = left + size.width + right
      const height = top + size.height + bottom

      this.swidth[i] = width
      this.sheight[i] = height
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Text.Data>): void {
    const {sx, sy, x_offset, y_offset, angle, outline_shape} = {...this, ...data}
    const {text, background_fill, background_hatch, border_line} = this.visuals
    const {anchor_: anchor, border_radius, padding} = this
    const {labels, swidth, sheight} = this

    for (const i of indices) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const label_i = labels[i]
      const shape_i = outline_shape.get(i)

      if (!isFinite(sx_i + sy_i + angle_i) || label_i == null) {
        continue
      }

      const swidth_i = swidth[i]
      const sheight_i = sheight[i]
      const anchor_i = anchor.get(i)

      const dx_i = anchor_i.x*swidth_i
      const dy_i = anchor_i.y*sheight_i

      ctx.translate(sx_i, sy_i)
      ctx.rotate(angle_i)
      ctx.translate(-dx_i, -dy_i)

      if (shape_i != "none" && (background_fill.v_doit(i) || background_hatch.v_doit(i) || border_line.v_doit(i))) {
        const bbox = new BBox({x: 0, y: 0, width: swidth_i, height: sheight_i})
        const visuals = {
          fill: background_fill,
          hatch: background_hatch,
          line: border_line,
        }
        this._paint_shape(ctx, i, shape_i, bbox, visuals, border_radius)
      }

      if (text.v_doit(i)) {
        const {left, top} = padding
        ctx.translate(left, top)
        label_i.visuals = text.values(i)
        label_i.paint(ctx)
        ctx.translate(-left, -top)
      }

      ctx.translate(dx_i, dy_i)
      ctx.rotate(-angle_i)
      ctx.translate(-sx_i, -sy_i)
    }
  }

  protected _paint_shape(ctx: Context2d, i: number, shape: OutlineShapeName, bbox: BBox, visuals: VectorVisuals, border_radius: Corners<number>): void {
    ctx.beginPath()
    switch (shape) {
      case "none": {
        break
      }
      case "box":
      case "rectangle": {
        round_rect(ctx, bbox, border_radius)
        break
      }
      case "square": {
        const square = (() => {
          const {x, y, width, height} = bbox
          if (width > height) {
            const dy = (width - height)/2
            return new BBox({x, y: y - dy, width, height: width})
          } else {
            const dx = (height - width)/2
            return new BBox({x: x - dx, y, width: height, height})
          }
        })()
        round_rect(ctx, square, border_radius)
        break
      }
      case "circle": {
        const cx = bbox.x_center
        const cy = bbox.y_center
        const radius = sqrt(bbox.width**2 + bbox.height**2)/2
        ctx.arc(cx, cy, radius, 0, 2*PI, false)
        break
      }
      case "ellipse": {
        const cx = bbox.x_center
        const cy = bbox.y_center
        const rx = bbox.width/2
        const ry = bbox.height/2
        const n = 1.5
        const x_0 = rx
        const y_0 = ry
        const a = sqrt(x_0**2 + x_0**(2/n)*y_0**(2 - 2/n))
        const b = sqrt(y_0**2 + y_0**(2/n)*x_0**(2 - 2/n))
        ctx.ellipse(cx, cy, a, b, 0, 0, 2*PI)
        break
      }
      case "trapezoid": {
        const {left, right, top, bottom, width} = bbox
        const ext = 0.2*width
        ctx.moveTo(left, top)
        ctx.lineTo(right, top)
        ctx.lineTo(right + ext, bottom)
        ctx.lineTo(left - ext, bottom)
        ctx.closePath()
        break
      }
      case "parallelogram": {
        const {left, right, top, bottom, width} = bbox
        const ext = 0.2*width
        ctx.moveTo(left, top)
        ctx.lineTo(right + ext, top)
        ctx.lineTo(right, bottom)
        ctx.lineTo(left - ext, bottom)
        ctx.closePath()
        break
      }
      case "diamond": {
        const {x_center, y_center, width, height} = bbox
        ctx.moveTo(x_center, y_center - height)
        ctx.lineTo(width + width/2, y_center)
        ctx.lineTo(x_center, y_center + height)
        ctx.lineTo(-width/2, y_center)
        ctx.closePath()
        break
      }
      case "triangle": {
        const w = bbox.width
        const h = bbox.height
        const l = sqrt(3)/2*w
        const H = h + l
        ctx.translate(w/2, -l)
        ctx.moveTo(0, 0)
        ctx.lineTo(H/2, H)
        ctx.lineTo(-H/2, H)
        ctx.closePath()
        ctx.translate(-w/2, l)
        break
      }
    }

    visuals.fill.apply(ctx, i)
    visuals.hatch.apply(ctx, i)
    visuals.line.apply(ctx, i)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const hit_xy = {x: geometry.sx, y: geometry.sy}

    const {sx, sy, x_offset, y_offset, angle, labels} = this
    const {anchor_: anchor} = this
    const {swidth, sheight} = this

    const n = this.data_size
    const indices = []

    for (let i = 0; i < n; i++) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const label_i = labels[i]

      if (!isFinite(sx_i + sy_i + angle_i) || label_i == null) {
        continue
      }

      const swidth_i = swidth[i]
      const sheight_i = sheight[i]
      const anchor_i = anchor.get(i)

      const dx_i = anchor_i.x*swidth_i
      const dy_i = anchor_i.y*sheight_i

      const {x, y} = rotate_around(hit_xy, {x: sx_i, y: sy_i}, -angle_i)

      const left = sx_i - dx_i
      const top = sy_i - dy_i
      const right = left + swidth_i
      const bottom = top + sheight_i

      // TODO: consider round corners
      if (left <= x && x <= right && top <= y && y <= bottom) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  rect_i(i: number): Rect {
    const {sx, sy, x_offset, y_offset, angle, labels} = this
    const {anchor_: anchor} = this
    const {swidth, sheight} = this

    const sx_i = sx[i] + x_offset.get(i)
    const sy_i = sy[i] + y_offset.get(i)
    const angle_i = angle.get(i)
    const label_i = labels[i]

    if (!isFinite(sx_i + sy_i + angle_i) || label_i == null) {
      return {
        p0: {x: NaN, y: NaN},
        p1: {x: NaN, y: NaN},
        p2: {x: NaN, y: NaN},
        p3: {x: NaN, y: NaN},
      }
    }
    const swidth_i = swidth[i]
    const sheight_i = sheight[i]
    const anchor_i = anchor.get(i)

    const dx_i = anchor_i.x*swidth_i
    const dy_i = anchor_i.y*sheight_i

    const bbox = new BBox({
      x: sx_i - dx_i,
      y: sy_i - dy_i,
      width: swidth_i,
      height: sheight_i,
    })
    const {rect} = bbox

    if (angle_i == 0) {
      return rect
    } else {
      const tr = new AffineTransform()
      tr.rotate_around(sx_i, sy_i, angle_i)
      return tr.apply_rect(rect)
    }
  }

  override scenterxy(i: number): [number, number] {
    const {p0, p1, p2, p3} = this.rect_i(i)
    const sx = (p0.x + p1.x + p2.x + p3.x)/4
    const sy = (p0.y + p1.y + p2.y + p3.y)/4
    return [sx, sy]
  }
}

export namespace Text {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextBase.Props & {
    outline_shape: OutlineShapeSpec
  } & Mixins

  export type Mixins = TextBase.Mixins

  export type Visuals = TextBase.Visuals

  export type Data = p.GlyphDataOf<Props> & {
    readonly labels: (GraphicsBox | null)[]

    swidth: Float32Array
    sheight: Float32Array

    anchor_: p.Uniform<XY<number>> // can't resolve in v_materialize() due to dependency on other properties
    padding: LRTB<number>
    border_radius: Corners<number>
  }
}

export interface Text extends Text.Attrs {}

export class Text extends TextBase {
  declare properties: Text.Props
  declare __view_type__: TextView

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextView

    this.define<Text.Props>(() => ({
      outline_shape: [ OutlineShapeSpec, "box" ],
    }))
  }
}
