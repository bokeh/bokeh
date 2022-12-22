import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {PointGeometry} from "core/geometry"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {UniformScalar, UniformVector} from "core/uniforms"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import {XY, LRTB, Corners, BBox} from "core/util/bbox"
import {enumerate} from "core/util/iterator"
import {AffineTransform, Rect} from "core/util/affine"
import {TextBox} from "core/graphics"
import {TextAnchor, BorderRadius, Padding} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"

export type TextData = XYGlyphData & p.UniformsOf<Text.Mixins> & {
  readonly text: p.Uniform<string | null>
  readonly angle: p.Uniform<number>
  readonly x_offset: p.Uniform<number>
  readonly y_offset: p.Uniform<number>

  labels: (TextBox | null)[]

  swidth: Float32Array
  sheight: Float32Array

  anchor: p.Uniform<XY<number>>
  padding: LRTB<number>
  border_radius: Corners<number>
}

export interface TextView extends TextData {}

export class TextView extends XYGlyphView {
  override model: Text
  override visuals: Text.Visuals

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)

    this.labels = Array.from(this.text, (value) => {
      if (value == null) {
        return null
      } else {
        const text = `${value}` // TODO: guarantee correct types earlier
        return new TextBox({text})
      }
    })
  }

  override after_visuals(): void {
    super.after_visuals()

    const n = this.data_size
    const {anchor, padding, border_radius} = this.model

    if (anchor != "auto") {
      this.anchor = new UniformScalar(resolve.anchor(anchor), n)
    } else {
      const {text_align, text_baseline} = this.visuals.text

      if (text_align.is_Scalar() && text_baseline.is_Scalar()) {
        const anchor = resolve.text_anchor("auto", text_align.value, text_baseline.value)
        this.anchor = new UniformScalar(anchor, n)
      } else {
        const anchors: XY<number>[] = new Array(n)
        for (let i = 0; i < n; i++) {
          const align_i = text_align.get(i)
          const baseline_i = text_baseline.get(i)
          anchors[i] = resolve.text_anchor("auto", align_i, baseline_i)
        }
        this.anchor = new UniformVector(anchors)
      }
    }

    this.padding = resolve.padding(padding)
    this.border_radius = resolve.border_radius(border_radius)

    this.swidth = new Float32Array(n)
    this.sheight = new Float32Array(n)

    const {left, right, top, bottom} = this.padding

    for (const [label, i] of enumerate(this.labels)) {
      if (label == null)
        continue

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

  protected _render(ctx: Context2d, indices: number[], data?: TextData): void {
    const {sx, sy, x_offset, y_offset, angle, labels} = data ?? this
    const {text, background_fill, background_hatch, border_line} = this.visuals
    const {anchor, border_radius, padding} = this
    const {swidth, sheight} = this

    for (const i of indices) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const label_i = labels[i]

      if (!isFinite(sx_i + sy_i + angle_i) || label_i == null)
        continue

      const swidth_i = swidth[i]
      const sheight_i = sheight[i]
      const anchor_i = anchor.get(i)

      const dx_i = anchor_i.x*swidth_i
      const dy_i = anchor_i.y*sheight_i

      ctx.translate(sx_i, sy_i)
      ctx.rotate(angle_i)
      ctx.translate(-dx_i, -dy_i)

      if (background_fill.v_doit(i) || background_hatch.v_doit(i) || border_line.v_doit(i)) {
        const bbox = new BBox({x: 0, y: 0, width: swidth_i, height: sheight_i})
        round_rect(ctx, bbox, border_radius)
        background_fill.apply(ctx, i)
        background_hatch.apply(ctx, i)
        border_line.apply(ctx, i)
      }

      if (text.v_doit(i)) {
        const {left, top} = padding
        ctx.translate(left, top)
        label_i.paint(ctx)
        ctx.translate(-left, -top)
      }

      ctx.translate(dx_i, dy_i)
      ctx.rotate(-angle_i)
      ctx.translate(-sx_i, -sy_i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx: px, sy: py} = geometry

    const {sx, sy, x_offset, y_offset, angle, labels} = this
    const {anchor} = this
    const {swidth, sheight} = this

    const n = this.data_size
    const indices = []

    for (let i = 0; i < n; i++) {
      const sx_i = sx[i] + x_offset.get(i)
      const sy_i = sy[i] + y_offset.get(i)
      const angle_i = angle.get(i)
      const label_i = labels[i]

      if (!isFinite(sx_i + sy_i + angle_i) || label_i == null)
        continue

      const swidth_i = swidth[i]
      const sheight_i = sheight[i]
      const anchor_i = anchor.get(i)

      const dx_i = anchor_i.x*swidth_i
      const dy_i = anchor_i.y*sheight_i

      const [x, y] = angle_i == 0 ? [px, py] : (() => {
        const tr = new AffineTransform()
        tr.rotate_around(sx_i, sy_i, -angle_i)
        return tr.apply(px, py)
      })()

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
    const {anchor} = this
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
    anchor: p.Property<TextAnchor>
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
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
}

export interface Text extends Text.Attrs {}

export class Text extends XYGlyph {
  override properties: Text.Props
  override __view_type__: TextView

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
      anchor: [ TextAnchor, "auto" ],
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
    }))

    this.override<Text.Props>({
      border_line_color: null,
      background_fill_color: null,
      background_hatch_color: null,
    })
  }
}
