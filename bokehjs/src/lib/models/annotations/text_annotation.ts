import {Annotation, AnnotationView} from "./annotation"
import * as visuals from "core/visuals"
import {TextBox} from "core/graphics"
import * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"

export abstract class TextAnnotationView extends AnnotationView {
  override model: TextAnnotation
  override visuals: TextAnnotation.Visuals

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), true)
    else
      this.layout = undefined
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _paint(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    const graphics = new TextBox({text})
    graphics.angle = angle
    graphics.position = {sx, sy}
    graphics.visuals = this.visuals.text.values()

    const {background_fill, border_line} = this.visuals
    if (background_fill.doit || border_line.doit) {
      const {p0, p1, p2, p3} = graphics.rect()
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.lineTo(p3.x, p3.y)
      ctx.closePath()

      this.visuals.background_fill.apply(ctx)
      this.visuals.border_line.apply(ctx)
    }

    if (this.visuals.text.doit)
      graphics.paint(ctx)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Annotation.Props

  export type Visuals = Annotation.Visuals & {
    text: visuals.Text
    border_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface TextAnnotation extends TextAnnotation.Attrs {}

export abstract class TextAnnotation extends Annotation {
  override properties: TextAnnotation.Props
  override __view_type__: TextAnnotationView

  constructor(attrs?: Partial<TextAnnotation.Attrs>) {
    super(attrs)
  }
}
