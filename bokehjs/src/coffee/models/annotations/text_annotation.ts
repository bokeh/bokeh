import {Annotation, AnnotationView} from "./annotation"
import {Text, Line, Fill} from "core/visuals"
import {show, hide} from "core/dom"
import {RenderMode} from "core/enums"
import * as p from "core/properties"
import {get_text_height} from "core/util/text"
import {Context2d} from "core/util/canvas"

export abstract class TextAnnotationView extends AnnotationView {
  model: TextAnnotation
  visuals: TextAnnotation.Visuals

  initialize(options: any): void {
    super.initialize(options)

    if (this.model.render_mode == 'css') {
      this.el.classList.add('bk-annotation')
      this.plot_view.canvas_overlays.appendChild(this.el)
    }
  }

  connect_signals(): void {
    super.connect_signals()
    if (this.model.render_mode == 'css') {
      // dispatch CSS update immediately
      this.connect(this.model.change, () => this.render())
    } else {
      this.connect(this.model.change, () => this.plot_view.request_render())
    }
  }

  protected _calculate_text_dimensions(ctx: Context2d, text: string): [number, number] {
    const {width} = ctx.measureText(text)
    const {height} = get_text_height(this.visuals.text.font_value())
    return [width, height]
  }

  protected _calculate_bounding_box_dimensions(ctx: Context2d, text: string): [number, number, number, number] {
    const [width, height] = this._calculate_text_dimensions(ctx, text)

    let x_offset: number
    switch (ctx.textAlign) {
      case 'left':   x_offset = 0;          break
      case 'center': x_offset = -width / 2; break
      case 'right':  x_offset = -width;     break
      default:
        throw new Error("unreachable code")
    }

    // guestimated from https://www.w3.org/TR/2dcontext/#dom-context-2d-textbaseline
    let y_offset: number
    switch (ctx.textBaseline) {
      case 'top':         y_offset =  0.0;           break
      case 'middle':      y_offset = -0.5  * height; break
      case 'bottom':      y_offset = -1.0  * height; break
      case 'alphabetic':  y_offset = -0.8  * height; break
      case 'hanging':     y_offset = -0.17 * height; break
      case 'ideographic': y_offset = -0.83 * height; break
      default:
        throw new Error("unreachable code")
    }

    return [x_offset, y_offset, width, height]
  }

  abstract render(): void

  protected _canvas_text(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    this.visuals.text.set_value(ctx)
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)

    if (angle)
      ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)
      ctx.stroke()
    }

    if (this.visuals.text.doit) {
      this.visuals.text.set_value(ctx)
      ctx.fillText(text, 0, 0)
    }

    ctx.restore()
  }

  protected _css_text(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    hide(this.el)

    this.visuals.text.set_value(ctx)
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text)

    // attempt to support vector string-style ("8 4 8") line dashing for css mode
    const ld = this.visuals.border_line.line_dash.value()
    const line_dash = ld.length < 2 ? "solid" : "dashed"

    this.visuals.border_line.set_value(ctx)
    this.visuals.background_fill.set_value(ctx)

    this.el.style.position = 'absolute'
    this.el.style.left = `${sx + bbox_dims[0]}px`
    this.el.style.top = `${sy + bbox_dims[1]}px`
    this.el.style.color = `${this.visuals.text.text_color.value()}`
    this.el.style.opacity = `${this.visuals.text.text_alpha.value()}`
    this.el.style.font = `${this.visuals.text.font_value()}`
    this.el.style.lineHeight = "normal"; // needed to prevent ipynb css override

    if (angle) {
      this.el.style.transform = `rotate(${angle}rad)`
    }

    if (this.visuals.background_fill.doit) {
      this.el.style.backgroundColor = `${this.visuals.background_fill.color_value()}`
    }

    if (this.visuals.border_line.doit) {
      this.el.style.borderStyle = `${line_dash}`
      this.el.style.borderWidth = `${this.visuals.border_line.line_width.value()}px`
      this.el.style.borderColor = `${this.visuals.border_line.color_value()}`
    }

    this.el.textContent = text
    show(this.el)
  }
}

export namespace TextAnnotation {
  export interface Attrs extends Annotation.Attrs {
    render_mode: RenderMode
  }

  export interface Props extends Annotation.Props {}

  export type Visuals = Annotation.Visuals & {
    text: Text
    border_line: Line
    background_fill: Fill
  }
}

export interface TextAnnotation extends TextAnnotation.Attrs {}

export abstract class TextAnnotation extends Annotation {

  properties: TextAnnotation.Props

  constructor(attrs?: Partial<TextAnnotation.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TextAnnotation"

    this.define({
      render_mode: [ p.RenderMode, "canvas" ],
    })
  }
}
TextAnnotation.initClass()
