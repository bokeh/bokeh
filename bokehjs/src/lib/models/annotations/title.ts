import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {VerticalAlign, TextAlign} from "core/enums"
import {Size, Layoutable} from "core/layout"
import {Panel} from "core/layout/side_panel"
import * as mixins from "core/property_mixins"
import * as p from "core/properties"
import {Position} from "core/graphics"

export class TitleView extends TextAnnotationView {
  override model: Title
  override visuals: Title.Visuals
  override layout: Layoutable
  override panel: Panel

  protected _get_position(): Position {
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

    const y_anchor = this.model.vertical_align == "middle" ? "center" : this.model.vertical_align

    return {sx, sy, x_anchor: this.model.align, y_anchor}
  }

  protected _render(): void {
    if (this._text_view == null)
      return

    this.model.text_baseline = this.model.vertical_align
    this.model.text_align = this.model.align

    this._paint(this.layer.ctx, this._get_position(), this.panel.get_label_angle_heuristic("parallel"))
  }

  protected override _get_size(): Size {
    if (this._text_view == null)
      return {width: 0, height: 0}

    const graphics = this._text_view.graphics()
    graphics.visuals = this.visuals.text.values()
    const {width, height} = graphics.size()
    // XXX: The magic 2px is for backwards compatibility. This will be removed at
    // some point, but currently there is no point breaking half of visual tests.
    return {width, height: height == 0 ? 0 : 2 + height + this.model.standoff}
  }
}

export namespace Title {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextAnnotation.Props & {
    vertical_align: p.Property<VerticalAlign>
    align: p.Property<TextAlign>
    offset: p.Property<number>
    standoff: p.Property<number>
  } & Mixins

  export type Mixins =
    mixins.Text           &
    mixins.BorderLine     &
    mixins.BackgroundFill

  export type Visuals = TextAnnotation.Visuals
}

export interface Title extends Title.Attrs {}

export class Title extends TextAnnotation {
  override properties: Title.Props
  override __view_type__: TitleView

  constructor(attrs?: Partial<Title.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TitleView

    this.mixins<Title.Mixins>([
      mixins.Text,
      ["border_",     mixins.Line],
      ["background_", mixins.Fill],
    ])

    this.define<Title.Props>(({Number}) => ({
      vertical_align:   [ VerticalAlign, "bottom" ],
      align:            [ TextAlign, "left" ],
      offset:           [ Number, 0 ],
      standoff:         [ Number, 10 ],
    }))

    this.prototype._props.text_align.options.internal = true
    this.prototype._props.text_baseline.options.internal = true

    this.override<Title.Props>({
      text_font_size: "13px",
      text_font_style: "bold",
      text_line_height: 1.0,
      background_fill_color: null,
      border_line_color: null,
    })
  }
}
