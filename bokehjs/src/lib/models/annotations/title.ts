import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {VerticalAlign, TextAlign} from "core/enums"
import {Size, Layoutable} from "core/layout"
import {Panel} from "core/layout/side_panel"
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

    const {align, vertical_align} = this.model

    let sx: number, sy: number
    const {bbox} = this.layout

    switch (this.panel.side) {
      case "above":
      case "below": {
        switch (vertical_align) {
          case "top":    sy = bbox.top     + vmargin; break
          case "middle": sy = bbox.vcenter;           break
          case "bottom": sy = bbox.bottom  - vmargin; break
        }

        switch (align) {
          case "left":   sx = bbox.left    + hmargin; break
          case "center": sx = bbox.hcenter;           break
          case "right":  sx = bbox.right   - hmargin; break
        }
        break
      }
      case "left": {
        switch (vertical_align) {
          case "top":    sx = bbox.left    + vmargin; break
          case "middle": sx = bbox.hcenter;           break
          case "bottom": sx = bbox.right   - vmargin; break
        }

        switch (align) {
          case "left":   sy = bbox.bottom  - hmargin; break
          case "center": sy = bbox.vcenter;           break
          case "right":  sy = bbox.top     + hmargin; break
        }
        break
      }
      case "right": {
        switch (vertical_align) {
          case "top":    sx = bbox.right   - vmargin; break
          case "middle": sx = bbox.hcenter;           break
          case "bottom": sx = bbox.left    + vmargin; break
        }

        switch (align) {
          case "left":   sy = bbox.top     + hmargin; break
          case "center": sy = bbox.vcenter;           break
          case "right":  sy = bbox.bottom  - hmargin; break
        }
        break
      }
    }

    const x_anchor = align
    const y_anchor = vertical_align == "middle" ? "center" : vertical_align

    return {sx, sy, x_anchor, y_anchor}
  }

  protected _render(): void {
    const position = this._get_position()
    const angle = this.panel.get_label_angle_heuristic("parallel")

    this._paint(this.layer.ctx, position, angle)
  }

  protected override _get_size(): Size {
    if (!this.displayed)
      return {width: 0, height: 0}

    const graphics = this._text_view.graphics()
    graphics.visuals = this.visuals.text.values()

    const {width, height} = graphics._size()
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
  }

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

    this.define<Title.Props>(({Number}) => ({
      vertical_align: [ VerticalAlign, "bottom" ],
      align:          [ TextAlign, "left" ],
      offset:         [ Number, 0 ],
      standoff:       [ Number, 10 ],
    }))

    this.override<Title.Props>({
      text_font_size: "13px",
      text_font_style: "bold",
      text_line_height: 1.0,
    })
  }
}
