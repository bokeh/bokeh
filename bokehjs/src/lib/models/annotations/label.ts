import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {compute_angle} from "core/util/math"
import type {CoordinateMapper} from "core/util/bbox"
import {CoordinateUnits, AngleUnits} from "core/enums"
import type {Size} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import type {Position} from "core/graphics"
import type {LRTB, XY} from "core/util/bbox"
import {TextAnchor, Padding} from "../common/kinds"
import * as resolve from "../common/resolve"

export class LabelView extends TextAnnotationView {
  declare model: Label
  declare visuals: Label.Visuals

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), false)
    else
      this.layout = undefined
  }

  protected override _get_size(): Size {
    if (!this.displayed)
      return {width: 0, height: 0}

    const graphics = this._text_view.graphics()
    graphics.angle = this.angle
    graphics.visuals = this.visuals.text.values()

    const {width, height} = graphics.size()
    return {width, height}
  }

  get mappers(): XY<CoordinateMapper> {
    function mapper(units: CoordinateUnits, scale: CoordinateMapper, view: CoordinateMapper, canvas: CoordinateMapper) {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const overlay = this.model
    const parent = this.layout ?? this.plot_view.frame
    const {x_scale, y_scale} = this.coordinates
    const {x_view, y_view} = parent.bbox
    const {x_screen, y_screen} = this.plot_view.canvas.bbox

    const xy = {
      x: mapper(overlay.x_units, x_scale, x_view, x_screen),
      y: mapper(overlay.y_units, y_scale, y_view, y_screen),
    }

    return xy
  }

  get anchor(): XY<number> {
    const {align, baseline} = this.visuals.text.values()
    return resolve.text_anchor(this.model.anchor, align, baseline)
  }

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get angle(): number {
    const {angle, angle_units} = this.model
    return compute_angle(angle, angle_units)
  }

  protected _render(): void {
    const {mappers} = this
    const {x, y, x_offset, y_offset} = this.model

    const sx = mappers.x.compute(x) + x_offset
    const sy = mappers.y.compute(y) - y_offset

    this._paint(this.layer.ctx, {sx, sy}, this.angle)
  }

  protected override _paint(ctx: Context2d, position: Position, angle: number): void {
    const graphics = this._text_view.graphics()
    graphics.position = {sx: 0, sy: 0, x_anchor: "left", y_anchor: "top"}
    graphics.align = "auto"
    graphics.visuals = this.visuals.text.values()

    const size = graphics.size()
    const {sx, sy} = position
    const {anchor, padding} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    const dx = anchor.x*width
    const dy = anchor.y*height

    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(angle)
    ctx.translate(-dx, -dy)

    const {background_fill, border_line} = this.visuals
    if (background_fill.doit || border_line.doit) {
      ctx.beginPath()
      ctx.rect(0, 0, width, height)

      this.visuals.background_fill.apply(ctx)
      this.visuals.border_line.apply(ctx)
    }

    if (this.visuals.text.doit) {
      ctx.translate(padding.left, padding.top)
      graphics.paint(ctx)
    }

    ctx.restore()
  }
}

export namespace Label {
  export type Props = TextAnnotation.Props & {
    anchor: p.Property<TextAnchor>
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
    x_offset: p.Property<number>
    y_offset: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    padding: p.Property<Padding>
  }

  export type Attrs = p.AttrsOf<Props>

  export type Visuals = TextAnnotation.Visuals
}

export interface Label extends Label.Attrs {}

export class Label extends TextAnnotation {
  declare properties: Label.Props
  declare __view_type__: LabelView

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelView

    this.define<Label.Props>(({Number, Angle}) => ({
      anchor:      [ TextAnchor, "auto" ],
      x:           [ Number ],
      y:           [ Number ],
      x_units:     [ CoordinateUnits, "data" ],
      y_units:     [ CoordinateUnits, "data" ],
      x_offset:    [ Number, 0 ],
      y_offset:    [ Number, 0 ],
      angle:       [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      padding:     [ Padding, 0 ],
    }))
  }
}
