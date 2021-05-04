import {Annotation, AnnotationView} from "./annotation"
import * as visuals from "core/visuals"
import {div, display, undisplay, remove} from "core/dom"
import {RenderMode} from "core/enums"
import * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import {font_metrics} from "core/util/text"
import {Context2d} from "core/util/canvas"
import {assert, unreachable} from "core/util/assert"

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

  protected el?: HTMLElement

  override initialize(): void {
    super.initialize()

    if (this.model.render_mode == 'css') {
      this.el = div()
      this.plot_view.canvas_view.add_overlay(this.el)
    }
  }

  override remove(): void {
    if (this.el != null)
      remove(this.el)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    if (this.model.render_mode == 'css') {
      // dispatch CSS update immediately
      this.connect(this.model.change, () => this.render())
    } else {
      this.connect(this.model.change, () => this.request_render())
    }
  }

  override render(): void {
    if (!this.model.visible && this.model.render_mode == "css")
      undisplay(this.el!)

    super.render()
  }

  protected _calculate_text_dimensions(ctx: Context2d, text: string): [number, number] {
    const {width} = ctx.measureText(text)
    const {height} = font_metrics(this.visuals.text.font_value())
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
        unreachable()
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
        unreachable()
    }

    return [x_offset, y_offset, width, height]
  }

  protected _canvas_text(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    this.visuals.text.set_value(ctx)
    const bbox_dims = this._calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)

    if (angle)
      ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

    this.visuals.background_fill.apply(ctx)
    this.visuals.border_line.apply(ctx)

    if (this.visuals.text.doit) {
      this.visuals.text.set_value(ctx)
      ctx.fillText(text, 0, 0)
    }

    ctx.restore()
  }

  protected _css_text(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    const {el} = this
    assert(el != null)

    undisplay(el)

    this.visuals.text.set_value(ctx)
    const [x, y] = this._calculate_bounding_box_dimensions(ctx, text)

    el.style.position = "absolute"
    el.style.left = `${sx + x}px`
    el.style.top = `${sy + y}px`
    el.style.color = ctx.fillStyle as string
    el.style.font = ctx.font
    el.style.lineHeight = "normal" // needed to prevent ipynb css override

    if (angle) {
      el.style.transform = `rotate(${angle}rad)`
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      el.style.backgroundColor = ctx.fillStyle as string
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      el.style.borderStyle = ctx.lineDash.length < 2 ? "solid" : "dashed"
      el.style.borderWidth = `${ctx.lineWidth}px`
      el.style.borderColor = ctx.strokeStyle as string
    }

    el.textContent = text
    display(el)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    render_mode: p.Property<RenderMode>
  }

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

  static init_TextAnnotation(): void {
    this.define<TextAnnotation.Props>(() => ({
      render_mode: [ RenderMode, "canvas" ],
    }))
  }
}
