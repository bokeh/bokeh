import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {SpatialUnits, AngleUnits} from "core/enums"
import {Size} from "core/layout"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"

export class LabelView extends TextAnnotationView {
  model: Label
  visuals: Label.Visuals

  initialize(): void {
    super.initialize()
    this.visuals.warm_cache()
  }

  protected _get_size(): Size {
    const {ctx} = this.layer
    this.visuals.text.set_value(ctx)

    const {width, ascent} = ctx.measureText(this.model.text)
    return {width, height: ascent}
  }

  protected _render(): void {
    // Here because AngleSpec does units transform and label doesn't support specs
    let angle: number
    switch (this.model.angle_units) {
      case "rad": {
        angle = -this.model.angle
        break
      }
      case "deg": {
        angle = (-this.model.angle*Math.PI)/180.0
        break
      }
    }

    const panel = this.panel != null ? this.panel : this.plot_view.frame

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.xview.compute(this.model.x)
    let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.yview.compute(this.model.y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.layer.ctx, this.model.text, sx, sy, angle)
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
    mixins.Text/*Scalar*/ &
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
      mixins.Text/*Scalar*/,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Label.Props>({
      x:            [ p.Number                       ],
      x_units:      [ p.SpatialUnits, 'data'         ],
      y:            [ p.Number                       ],
      y_units:      [ p.SpatialUnits, 'data'         ],
      text:         [ p.String                       ],
      angle:        [ p.Angle,       0               ],
      angle_units:  [ p.AngleUnits,  'rad'           ],
      x_offset:     [ p.Number,      0               ],
      y_offset:     [ p.Number,      0               ],
    })

    this.override({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
