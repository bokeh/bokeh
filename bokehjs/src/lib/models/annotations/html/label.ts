import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {compute_angle} from "core/util/math"
import {CoordinateUnits, AngleUnits} from "core/enums"
import {TextBox} from "core/graphics"
import type {Size} from "core/layout"
import {SideLayout} from "core/layout/side_panel"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"

export class HTMLLabelView extends TextAnnotationView {
  declare model: HTMLLabel
  declare visuals: HTMLLabel.Visuals

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), false)
    else
      this.layout = undefined
  }

  // XXX: this needs to use CSS computed styles
  protected override _get_size(): Size {
    const {text} = this.model
    const graphics = new TextBox({text})
    const {angle, angle_units} = this.model
    graphics.angle = compute_angle(angle, angle_units)
    graphics.visuals = this.visuals.text.values()

    const size = graphics.size()
    const {padding} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    return {width, height}
  }

  protected _render(): void {
    const {angle, angle_units} = this.model
    const rotation = compute_angle(angle, angle_units)

    const panel = this.layout != null ? this.layout : this.plot_view.frame

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    let sx = (() => {
      switch (this.model.x_units) {
        case "canvas":
          return this.model.x
        case "screen":
          return panel.bbox.xview.compute(this.model.x)
        case "data":
          return xscale.compute(this.model.x)
      }
    })()

    let sy = (() => {
      switch (this.model.y_units) {
        case "canvas":
          return this.model.y
        case "screen":
          return panel.bbox.yview.compute(this.model.y)
        case "data":
          return yscale.compute(this.model.y)
      }
    })()

    sx += this.model.x_offset
    sy -= this.model.y_offset

    this._paint(this.layer.ctx, this.model.text, sx, sy, rotation)
  }
}

export namespace HTMLLabel {
  export type Props = TextAnnotation.Props & {
    x: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y: p.Property<number>
    y_units: p.Property<CoordinateUnits>
    text: p.Property<string>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    x_offset: p.Property<number>
    y_offset: p.Property<number>
  } & Mixins

  export type Attrs = p.AttrsOf<Props>

  export type Mixins =
    mixins.Text &
    mixins.BorderLine &
    mixins.BackgroundFill &
    mixins.BackgroundHatch

  export type Visuals = TextAnnotation.Visuals
}

export interface HTMLLabel extends HTMLLabel.Attrs {}

export class HTMLLabel extends TextAnnotation {
  declare properties: HTMLLabel.Props
  declare __view_type__: HTMLLabelView

  constructor(attrs?: Partial<HTMLLabel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLLabelView

    this.mixins<HTMLLabel.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
    ])

    this.define<HTMLLabel.Props>(({Number, String, Angle}) => ({
      x:           [ Number ],
      x_units:     [ CoordinateUnits, "data" ],
      y:           [ Number ],
      y_units:     [ CoordinateUnits, "data" ],
      text:        [ String, "" ],
      angle:       [ Angle, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      x_offset:    [ Number, 0 ],
      y_offset:    [ Number, 0 ],
    }))

    this.override<HTMLLabel.Props>({
      background_fill_color: null,
      background_hatch_color: null,
      border_line_color: null,
    })
  }
}
