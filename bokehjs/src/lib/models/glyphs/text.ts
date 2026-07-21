import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type {PointGeometry} from "core/geometry"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"
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
import type {TextAnchor} from "../common/kinds"
import {BorderRadius, Padding} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"
import type {VectorVisuals} from "./defs"
import {sqrt, PI} from "core/util/math"
import type {OutlineShapeName} from "core/enums"
import type {TextGL} from "./webgl/text"

class TextAnchorSpec extends p.DataSpec<TextAnchor> {}
class OutlineShapeSpec extends p.DataSpec<OutlineShapeName> {}

export interface TextView extends Text.Data {}

export class TextView extends XYGlyphView {
  declare model: Text
  declare visuals: Text.Visuals

  /** @internal */
  declare glglyph?: TextGL

  override async load_glglyph() {
    const {TextGL} = await import("./webgl/text")
    return TextGL
  }

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
    const {anchor} = this.base ?? this
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

    for (const i of indices) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const shape_i = outline_shape.get(i)

      this._paint_one(ctx, i, sx_i, sy_i, angle_i, shape_i)
    }
  }

  private _paint_one(
    ctx: Context2d, i: number, sx: number, sy: number, angle: number, shape: OutlineShapeName,
  ): void {
    const {text, background_fill, background_hatch, border_line} = this.visuals
    const {anchor_: anchor, border_radius, padding} = this
    const {labels, swidth, sheight} = this
    const label = labels[i]

    if (!isFinite(sx + sy + angle) || label == null) {
      return
    }

    const width = swidth[i]
    const height = sheight[i]
    const anchor_i = anchor.get(i)

    const dx = anchor_i.x*width
    const dy = anchor_i.y*height

    ctx.translate(sx, sy)
    ctx.rotate(angle)
    ctx.translate(-dx, -dy)

    if (shape != "none" && (background_fill.v_doit(i) || background_hatch.v_doit(i) || border_line.v_doit(i))) {
      const bbox = new BBox({x: 0, y: 0, width, height})
      const visuals = {
        fill: background_fill,
        hatch: background_hatch,
        line: border_line,
      }
      this._paint_shape(ctx, i, shape, bbox, visuals, border_radius)
    }

    if (text.v_doit(i)) {
      const {left, top} = padding
      ctx.translate(left, top)
      label.visuals = text.values(i)
      label.paint(ctx)
      ctx.translate(-left, -top)
    }

    ctx.translate(dx, dy)
    ctx.rotate(-angle)
    ctx.translate(-sx, -sy)
  }

  /** Bounds of one unrotated rasterized label, relative to its content box. */
  webgl_bbox(i: number): BBox | null {
    const {labels, swidth, sheight, outline_shape} = this
    if (labels[i] == null || !isFinite(swidth[i] + sheight[i])) {
      return null
    }

    const width = swidth[i]
    const height = sheight[i]
    const {text, background_fill, background_hatch, border_line} = this.visuals
    const have_text = text.v_doit(i)
    let bbox = new BBox({x: 0, y: 0, width, height})
    const shape = outline_shape.get(i)
    const have_shape = shape != "none" &&
      (background_fill.v_doit(i) || background_hatch.v_doit(i) || border_line.v_doit(i))
    if (!have_text && !have_shape) {
      return null
    }
    if (have_shape) {
      bbox = bbox.union(this._shape_bbox(shape, bbox))
    }

    let fringe = 1
    if (have_text) {
      fringe = Math.max(fringe, text.text_outline_width.get(i)/2 + 1)
    }
    if (border_line.v_doit(i)) {
      fringe = Math.max(fringe, border_line.line_width.get(i)/2 + 1)
    }
    return bbox.grow_by(fringe)
  }

  /** Paint one unrotated label into an atlas with its content box at (x, y). */
  webgl_paint(ctx: Context2d, i: number, x: number, y: number): void {
    const anchor = this.anchor_.get(i)
    const sx = x + anchor.x*this.swidth[i]
    const sy = y + anchor.y*this.sheight[i]
    this._paint_one(ctx, i, sx, sy, 0, this.outline_shape.get(i))
  }

  private _shape_bbox(shape: OutlineShapeName, bbox: BBox): BBox {
    const {x, y, width, height, x_center, y_center} = bbox
    switch (shape) {
      case "none":
      case "box":
      case "rectangle":
        return bbox
      case "square": {
        const size = Math.max(width, height)
        return new BBox({x: x_center, y: y_center, width: size, height: size, origin: "center"})
      }
      case "circle": {
        const size = sqrt(width**2 + height**2)
        return new BBox({x: x_center, y: y_center, width: size, height: size, origin: "center"})
      }
      case "ellipse": {
        const rx = width/2
        const ry = height/2
        const n = 1.5
        const a = sqrt(rx**2 + rx**(2/n)*ry**(2 - 2/n))
        const b = sqrt(ry**2 + ry**(2/n)*rx**(2 - 2/n))
        return new BBox({x: x_center, y: y_center, width: 2*a, height: 2*b, origin: "center"})
      }
      case "trapezoid":
      case "parallelogram": {
        const ext = 0.2*width
        return new BBox({left: x - ext, right: x + width + ext, top: y, bottom: y + height})
      }
      case "diamond":
        return new BBox({left: x - width/2, right: x + 1.5*width, top: y - height/2, bottom: y + 1.5*height})
      case "triangle": {
        const l = sqrt(3)/2*width
        const H = height + l
        return new BBox({left: x + (width - H)/2, right: x + (width + H)/2, top: y - l, bottom: y + height})
      }
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

  export type Props = XYGlyph.Props & {
    text: p.NullStringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
    anchor: TextAnchorSpec
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
    outline_shape: OutlineShapeSpec
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.BorderLineVector &
    mixins.BackgroundFillVector &
    mixins.BackgroundHatchVector

  export type Visuals = XYGlyph.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
    background_hatch: visuals.HatchVector
  }

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

export class Text extends XYGlyph {
  declare properties: Text.Props
  declare __view_type__: TextView

  constructor(attrs?: Partial<Text.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextView

    this.mixins<Text.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
      ["background_", mixins.HatchVector],
    ])

    this.define<Text.Props>(() => ({
      text: [ p.NullStringSpec, {field: "text"} ],
      angle: [ p.AngleSpec, 0 ],
      x_offset: [ p.NumberSpec, 0 ],
      y_offset: [ p.NumberSpec, 0 ],
      anchor: [ TextAnchorSpec, {value: "auto"} ],
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
      outline_shape: [ OutlineShapeSpec, "box" ],
    }))

    this.override<Text.Props>({
      border_line_color: null,
      background_fill_color: null,
      background_hatch_color: null,
    })
  }
}
