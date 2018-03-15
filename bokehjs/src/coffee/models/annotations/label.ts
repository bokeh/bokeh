import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {TextMixinScalar} from "core/property_mixins"
import {Color} from "core/types"
import {LineJoin, LineCap} from "core/enums"
import {SpatialUnits, AngleUnits} from "core/enums"
import {hide} from "core/dom"
import * as p from "core/properties"

export class LabelView extends TextAnnotationView {
  model: Label
  visuals: Label.Visuals

  initialize(options: any): void {
    super.initialize(options)
    this.visuals.warm_cache()
  }

  protected _get_size(): number {
    const {ctx} = this.plot_view.canvas_view
    this.visuals.text.set_value(ctx)

    if (this.model.panel!.is_horizontal) {
      const height = ctx.measureText(this.model.text).ascent
      return height
    } else {
      const {width} = ctx.measureText(this.model.text)
      return width
    }
  }

  render(): void {
    if (!this.model.visible && this.model.render_mode == 'css')
      hide(this.el)

    if (!this.model.visible)
      return

    // Here because AngleSpec does units tranform and label doesn't support specs
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
      default:
        throw new Error("unreachable code")
    }

    const panel = this.model.panel != null ? this.model.panel : this.plot_view.frame

    const xscale = this.plot_view.frame.xscales[this.model.x_range_name]
    const yscale = this.plot_view.frame.yscales[this.model.y_range_name]

    let sx = this.model.x_units == "data" ? xscale.compute(this.model.x) : panel.xview.compute(this.model.x)
    let sy = this.model.y_units == "data" ? yscale.compute(this.model.y) : panel.yview.compute(this.model.y)

    sx += this.model.x_offset
    sy -= this.model.y_offset

    const draw = this.model.render_mode == 'canvas' ? this._canvas_text.bind(this) : this._css_text.bind(this)
    draw(this.plot_view.canvas_view.ctx, this.model.text, sx, sy, angle)
  }
}

export namespace Label {
  // line:border_
  export interface BorderLine {
    border_line_color: Color
    border_line_width: number
    border_line_alpha: number
    border_line_join: LineJoin
    border_line_cap: LineCap
    border_line_dash: number[]
    border_line_dash_offset: number
  }

  // fill:background_
  export interface BackgorundFill {
    background_fill_color: Color
    background_fill_alpha: number
  }

  export interface Mixins extends TextMixinScalar, BorderLine, BackgorundFill {}

  export interface Attrs extends TextAnnotation.Attrs, Mixins {
    x: number
    x_units: SpatialUnits
    y: number
    y_units: SpatialUnits
    text: string
    angle: number
    angle_units: AngleUnits
    x_offset: number
    y_offset: number
    x_range_name: string
    y_range_name: string
  }

  export interface Props extends TextAnnotation.Props {}

  export type Visuals = TextAnnotation.Visuals
}

export interface Label extends Label.Attrs {}

export class Label extends TextAnnotation {

  properties: Label.Props

  constructor(attrs?: Partial<Label.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Label'
    this.prototype.default_view = LabelView

    this.mixins(['text', 'line:border_', 'fill:background_'])

    this.define({
      x:            [ p.Number,                      ],
      x_units:      [ p.SpatialUnits, 'data'         ],
      y:            [ p.Number,                      ],
      y_units:      [ p.SpatialUnits, 'data'         ],
      text:         [ p.String,                      ],
      angle:        [ p.Angle,       0               ],
      angle_units:  [ p.AngleUnits,  'rad'           ],
      x_offset:     [ p.Number,      0               ],
      y_offset:     [ p.Number,      0               ],
      x_range_name: [ p.String,      'default'       ],
      y_range_name: [ p.String,      'default'       ],
    })

    this.override({
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
Label.initClass()
