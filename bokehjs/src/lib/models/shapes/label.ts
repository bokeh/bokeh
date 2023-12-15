import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {AngleUnits, Direction} from "core/enums"
import {Fill, Hatch, Line, Text} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {compute_angle} from "core/util/math"
import {TextBox} from "core/graphics"
import {BBox} from "core/util/bbox"
import {TextAnchor, Padding, BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"

export class LabelView extends ShapeView {
  declare model: Label
  declare visuals: Label.Visuals

  get geometry() {
    const {xy, text} = this.model
    const {sx, sy} = this.compute_coord(xy)

    const text_box = new TextBox({text})
    text_box.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    text_box.align = "auto"
    text_box.visuals = this.visuals.text.values()

    const angle = (() => {
      const {angle, angle_units, direction} = this.model
      return compute_angle(angle, angle_units, direction)
    })()

    const padding = resolve.padding(this.model.padding)
    const border_radius = resolve.border_radius(this.model.border_radius)

    const size = text_box.size()
    const swidth = size.width + padding.left + padding.right
    const sheight = size.height + padding.top + padding.bottom

    const anchor = (() => {
      const {align, baseline} = this.visuals.text.values()
      return resolve.text_anchor(this.model.anchor, align, baseline)
    })()

    const dx = anchor.x*swidth
    const dy = anchor.y*sheight

    const sx0 = sx - dx
    const sy0 = sy - dy

    return {
      sx0, sy0,
      sx, sy,
      dx, dy,
      swidth, sheight,
      angle,
      text_box,
      anchor,
      padding,
      border_radius,
    }
  }

  paint(ctx: Context2d): void {
    const {geometry} = this

    const {sx, sy} = this.geometry
    if (!isFinite(sx + sy)) {
      return
    }

    const {dx, dy, angle} = this.geometry
    ctx.translate(sx, sy)
    ctx.rotate(angle)
    ctx.translate(-dx, -dy)

    const {fill, hatch, line} = this.visuals
    if (fill.doit || hatch.doit || line.doit) {
      const {swidth, sheight, border_radius} = this.geometry
      const bbox = new BBox({x: 0, y: 0, width: swidth, height: sheight})
      ctx.beginPath()
      round_rect(ctx, bbox, border_radius)
      fill.apply(ctx)
      hatch.apply(ctx)
      line.apply(ctx)
    }

    if (this.visuals.text.doit) {
      const {padding, text_box} = geometry
      const {left, top} = padding
      ctx.translate(left, top)
      text_box.paint(ctx)
      ctx.translate(-left, -top)
    }

    ctx.translate(dx, dy)
    ctx.rotate(-angle)
    ctx.translate(-sx, -sy)
  }
}

export namespace Label {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    width: p.Property<number | null>
    height: p.Property<number | null>
    anchor: p.Property<TextAnchor>
    text: p.Property<string>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
  } & Mixins

  export type Mixins = Fill & Hatch & Line & Text

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
    text: visuals.Text
  }
}

export interface Label extends Label.Attrs {}

export class Label extends Shape {
  declare properties: Label.Props
  declare __view_type__: LabelView

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelView

    this.mixins<Label.Mixins>([Fill, Hatch, Line, Text])

    this.define<Label.Props>(({String, Number, Angle, Ref, NonNegative, Nullable}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      width:  [ Nullable(NonNegative(Number)), null ],
      height: [ Nullable(NonNegative(Number)), null ],
      anchor: [ TextAnchor, "auto" ],
      text: [ String, "" ],
      angle: [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction: [ Direction, "anticlock" ],
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
    }))
  }
}
