import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {VerticalAlign, TextAlign} from "core/enums"
import {TextBox} from "core/graphics"
import type {Size, Layoutable} from "core/layout"
import type {Panel} from "core/layout/side_panel"
import * as mixins from "core/property_mixins"
import type * as p from "core/properties"

export class HTMLTitleView extends TextAnnotationView {
  declare model: HTMLTitle
  declare visuals: HTMLTitle.Visuals
  declare layout: Layoutable
  declare panel: Panel

  protected _get_location(): [number, number] {
    const hmargin = this.model.offset
    const vmargin = this.model.standoff/2

    let sx: number, sy: number
    const {bbox} = this.layout
    switch (this.panel.side) {
      case "above":
      case "below": {
        switch (this.model.vertical_align) {
          case "top":    sy = bbox.top     + vmargin; break
          case "middle": sy = bbox.vcenter;           break
          case "bottom": sy = bbox.bottom  - vmargin; break
        }

        switch (this.model.align) {
          case "left":   sx = bbox.left    + hmargin; break
          case "center": sx = bbox.hcenter;           break
          case "right":  sx = bbox.right   - hmargin; break
        }
        break
      }
      case "left": {
        switch (this.model.vertical_align) {
          case "top":    sx = bbox.left    + vmargin; break
          case "middle": sx = bbox.hcenter;           break
          case "bottom": sx = bbox.right   - vmargin; break
        }

        switch (this.model.align) {
          case "left":   sy = bbox.bottom  - hmargin; break
          case "center": sy = bbox.vcenter;           break
          case "right":  sy = bbox.top     + hmargin; break
        }
        break
      }
      case "right": {
        switch (this.model.vertical_align) {
          case "top":    sx = bbox.right   - vmargin; break
          case "middle": sx = bbox.hcenter;           break
          case "bottom": sx = bbox.left    + vmargin; break
        }

        switch (this.model.align) {
          case "left":   sy = bbox.top     + hmargin; break
          case "center": sy = bbox.vcenter;           break
          case "right":  sy = bbox.bottom  - hmargin; break
        }
        break
      }
    }

    return [sx, sy]
  }

  protected _render(): void {
    const {text} = this.model
    if (text.length == 0)
      return

    this.model.text_baseline = this.model.vertical_align
    this.model.text_align = this.model.align

    const [sx, sy] = this._get_location()
    const angle = this.panel.get_label_angle_heuristic("parallel")

    this._paint(this.layer.ctx, text, sx, sy, angle)
  }

  // XXX: this needs to use CSS computed styles
  protected override _get_size(): Size {
    const {text} = this.model
    const graphics = new TextBox({text})
    graphics.visuals = this.visuals.text.values()

    const size = graphics.size()
    const {padding} = this

    const width = size.width + padding.left + padding.right
    const height = size.height + padding.top + padding.bottom

    // XXX: The magic 2px is for backwards compatibility. This will be removed at
    // some point, but currently there is no point breaking half of visual tests.
    return {width, height: height == 0 ? 0 : 2 + height + this.model.standoff}
  }
}

export namespace HTMLTitle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextAnnotation.Props & {
    text: p.Property<string>
    vertical_align: p.Property<VerticalAlign>
    align: p.Property<TextAlign>
    offset: p.Property<number>
    standoff: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.Text           &
    mixins.BorderLine     &
    mixins.BackgroundFill &
    mixins.BackgroundHatch

  export type Visuals = TextAnnotation.Visuals
}

export interface HTMLTitle extends HTMLTitle.Attrs {}

export class HTMLTitle extends TextAnnotation {
  declare properties: HTMLTitle.Props
  declare __view_type__: HTMLTitleView

  constructor(attrs?: Partial<HTMLTitle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HTMLTitleView

    this.mixins<HTMLTitle.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
      ["background_", mixins.Hatch],
    ])

    this.define<HTMLTitle.Props>(({Number, String}) => ({
      text:             [ String, "" ],
      vertical_align:   [ VerticalAlign, "bottom" ],
      align:            [ TextAlign, "left" ],
      offset:           [ Number, 0 ],
      standoff:         [ Number, 10 ],
    }))

    this.prototype._props.text_align.options.internal = true
    this.prototype._props.text_baseline.options.internal = true

    this.override<HTMLTitle.Props>({
      text_font_size: "13px",
      text_font_style: "bold",
      text_line_height: 1.0,
      background_fill_color: null,
      background_hatch_color: null,
      border_line_color: null,
    })
  }
}
