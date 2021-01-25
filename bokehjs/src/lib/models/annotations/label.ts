import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {resolve_angle} from "core/util/math"
import {font_metrics} from "core/util/text"
import {SpatialUnits, AngleUnits} from "core/enums"
import {Size} from "core/layout"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"

export class LabelView extends TextAnnotationView {
  model: Label
  visuals: Label.Visuals

  protected _get_size(): Size {
    const {ctx} = this.layer
    this.visuals.text.set_value(ctx)
    const {width} = ctx.measureText(this.model.text)
    const {height} = font_metrics(ctx.font)
    return {width, height}
  }

  protected _render(): void {
    const {angle, angle_units} = this.model
    const rotation = resolve_angle(angle, angle_units)

    const panel = this.layout != null ? this.layout : this.plot_view.frame

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.bbox.xview.compute(this.model.x)
    let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.bbox.yview.compute(this.model.y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.layer.ctx, this.model.text, sx, sy, rotation)
  }
}

export namespace Label {
  export type Props = TextAnnotation.Props & {
    x: p.Property<number>
    x_units: p.Property<SpatialUnits>
    y: p.Property<number>
    y_units: p.Property<SpatialUnits>
    text: p.Property<string>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    x_offset: p.Property<number>
    y_offset: p.Property<number>
  } & Mixins

  export type Attrs = p.AttrsOf<Props>

  export type Mixins =
    mixins.Text &
    mixins.BorderLine     &
    mixins.BackgroundFill

  export type Visuals = TextAnnotation.Visuals
}

export interface Label extends Label.Attrs {}

export class Label extends TextAnnotation {
  properties: Label.Props
  __view_type__: LabelView

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static init_Label(): void {
    this.prototype.default_view = LabelView

    this.mixins<Label.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Label.Props>(({Number, String, Angle}) => ({
      x:           [ Number ],
      x_units:     [ SpatialUnits, "data" ],
      y:           [ Number ],
      y_units:     [ SpatialUnits, "data" ],
      text:        [ String, "" ],
      angle:       [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      x_offset:    [ Number, 0 ],
      y_offset:    [ Number, 0 ],
    }))

    this.override<Label.Props>({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
