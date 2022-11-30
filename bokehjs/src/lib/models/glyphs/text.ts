import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {PointGeometry} from "core/geometry"
import * as mixins from "core/property_mixins"
import * as hittest from "core/hittest"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {assert} from "core/util/assert"
import {Selection} from "../selections/selection"
import {TextBox} from "core/graphics"

export type TextData = XYGlyphData & p.UniformsOf<Text.Mixins> & {
  readonly text: p.Uniform<string | null>
  readonly angle: p.Uniform<number>
  readonly x_offset: p.Uniform<number>
  readonly y_offset: p.Uniform<number>

  labels: (TextBox | null)[]
}

export interface TextView extends TextData {}

export class TextView extends XYGlyphView {
  override model: Text
  override visuals: Text.Visuals

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)

    this.labels = Array.from(this.text, (value) => {
      const text = `${value}` // TODO: guarantee correct types earlier
      return value != null ? new TextBox({text}) : null
    })
  }

  protected _render(ctx: Context2d, indices: number[], data?: TextData): void {
    const {sx, sy, x_offset, y_offset, angle, labels} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const x_offset_i = x_offset.get(i)
      const y_offset_i = y_offset.get(i)
      const angle_i = angle.get(i)
      const label_i = labels[i]

      if (!isFinite(sx_i + sy_i + x_offset_i + y_offset_i + angle_i) || label_i == null)
        continue

      if (!this.visuals.text.v_doit(i))
        continue

      label_i.visuals = this.visuals.text.values(i)
      // TODO: perhaps this should be in _map_data()
      label_i.position = {
        sx: sx_i + x_offset_i,
        sy: sy_i + y_offset_i,
      }
      label_i.angle = angle_i
      label_i.align = "auto"

      if (this.visuals.background_fill.v_doit(i) || this.visuals.border_line.v_doit(i)) {
        const {p0, p1, p2, p3} = label_i.rect()
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.closePath()

        this.visuals.background_fill.apply(ctx, i)
        this.visuals.border_line.apply(ctx, i)
      }

      label_i.paint(ctx)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const indices = []

    let i = 0
    for (const label of this.labels) {
      if (label != null) {
        const {p0, p1, p2, p3} = label.rect()
        if (hittest.point_in_poly(sx, sy, [p0.x, p1.x, p2.x, p3.x], [p0.y, p1.y, p2.y, p3.y]))
          indices.push(i)
      }
      i += 1
    }

    return new Selection({indices})
  }

  override scenterxy(i: number): [number, number] {
    const label = this.labels[i]
    assert(label != null)
    const {p0, p1, p2, p3} = label.rect()
    const sxc = (p0.x + p1.x + p2.x + p3.x)/4
    const syc = (p0.y + p1.y + p2.y + p3.y)/4
    return [sxc, syc]
  }
}

export namespace Text {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    text: p.NullStringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.BorderLineVector &
    mixins.BackgroundFillVector

  export type Visuals = XYGlyph.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
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
    ])

    this.define<Text.Props>(() => ({
      text: [ p.NullStringSpec, {field: "text"} ],
      angle: [ p.AngleSpec, 0 ],
      x_offset: [ p.NumberSpec, 0 ],
      y_offset: [ p.NumberSpec, 0 ],
    }))

    this.override<Text.Props>({
      border_line_color: null,
      background_fill_color: null,
    })
  }
}
