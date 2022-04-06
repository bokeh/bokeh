import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {resolve_angle} from "core/util/math"
import {SpatialUnits, AngleUnits} from "core/enums"
import {Size} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import * as p from "core/properties"

export class LabelView extends TextAnnotationView {
  override model: Label
  override visuals: Label.Visuals

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
    const {angle, angle_units} = this.model
    graphics.angle = resolve_angle(angle, angle_units)
    graphics.visuals = this.visuals.text.values()
    const {width, height} = graphics.size()
    return {width, height}
  }

  protected _render(): void {
    const {angle, angle_units} = this.model
    const rotation = resolve_angle(angle, angle_units)

    const panel = this.layout != null ? this.layout : this.plot_view.frame

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.bbox.x_view.compute(this.model.x)
    let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.bbox.y_view.compute(this.model.y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    this._paint(this.layer.ctx, {sx, sy}, rotation)
  }
}

export namespace Label {
  export type Props = TextAnnotation.Props & {
    x: p.Property<number>
    x_units: p.Property<SpatialUnits>
    y: p.Property<number>
    y_units: p.Property<SpatialUnits>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    x_offset: p.Property<number>
    y_offset: p.Property<number>
  }

  export type Attrs = p.AttrsOf<Props>

  export type Visuals = TextAnnotation.Visuals
}

export interface Label extends Label.Attrs {}

export class Label extends TextAnnotation {
  override properties: Label.Props
  override __view_type__: LabelView

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LabelView

    this.define<Label.Props>(({Number, Angle}) => ({
      x:           [ Number ],
      x_units:     [ SpatialUnits, "data" ],
      y:           [ Number ],
      y_units:     [ SpatialUnits, "data" ],
      angle:       [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      x_offset:    [ Number, 0 ],
      y_offset:    [ Number, 0 ],
    }))
  }
}
