import {Annotation, AnnotationView} from "../annotation"
import type * as visuals from "core/visuals"
import {div, display, undisplay, remove} from "core/dom"
import type * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import type {Context2d} from "core/util/canvas"
import {Padding, BorderRadius} from "../../common/kinds"
import * as resolve from "../../common/resolve"
import type {LRTB, Corners} from "core/util/bbox"

export abstract class TextAnnotationView extends AnnotationView {
  declare model: TextAnnotation
  declare visuals: TextAnnotation.Visuals

  override update_layout(): void {
    const {panel} = this
    if (panel != null)
      this.layout = new SideLayout(panel, () => this.get_size(), true)
    else
      this.layout = undefined
  }

  protected el: HTMLElement

  override initialize(): void {
    super.initialize()
    this.el = div()
    this.plot_view.canvas_view.add_overlay(this.el)
  }

  override remove(): void {
    remove(this.el)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  override render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  protected _paint(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    const {el} = this
    undisplay(el)

    el.textContent = text
    this.visuals.text.set_value(ctx)

    el.style.position = "absolute"
    el.style.left = `${sx}px`
    el.style.top = `${sy}px`
    el.style.color = ctx.fillStyle as string
    el.style.webkitTextStroke = `1px ${ctx.strokeStyle}`
    el.style.font = ctx.font
    el.style.lineHeight = "normal" // needed to prevent ipynb css override
    el.style.whiteSpace = "pre"

    el.style.padding = (() => {
      const {left, right, top, bottom} = this.padding
      return `${top}px ${right}px ${bottom}px ${left}px`
    })()

    el.style.borderRadius = (() => {
      const {top_left, top_right, bottom_right, bottom_left} = this.border_radius
      return `${top_left}px ${top_right}px ${bottom_right}px ${bottom_left}px`
    })()

    const [x_anchor, x_t] = (() => {
      switch (this.visuals.text.text_align.get_value()) {
        case "left": return ["left", "0%"]
        case "center": return ["center", "-50%"]
        case "right": return ["right", "-100%"]
      }
    })()
    const [y_anchor, y_t] = (() => {
      switch (this.visuals.text.text_baseline.get_value()) {
        case "top": return ["top", "0%"]
        case "middle": return ["center", "-50%"]
        case "bottom": return ["bottom", "-100%"]
        default: return ["center", "-50%"] // "baseline"
      }
    })()

    let transform = `translate(${x_t}, ${y_t})`
    if (angle != 0) {
      transform += `rotate(${angle}rad)`
    }

    el.style.transformOrigin = `${x_anchor} ${y_anchor}`
    el.style.transform = transform

    if (this.layout == null) {
      // const {bbox} = this.plot_view.frame
      // const {left, right, top, bottom} = bbox
      // el.style.clipPath = ???
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      el.style.backgroundColor = ctx.fillStyle as string
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      el.style.borderStyle = ctx.getLineDash().length < 2 ? "solid" : "dashed"
      el.style.borderWidth = `${ctx.lineWidth}px`
      el.style.borderColor = ctx.strokeStyle as string
    }

    display(el)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
  }

  export type Visuals = Annotation.Visuals & {
    text: visuals.Text
    border_line: visuals.Line
    background_fill: visuals.Fill
  }
}

export interface TextAnnotation extends TextAnnotation.Attrs {}

export abstract class TextAnnotation extends Annotation {
  declare properties: TextAnnotation.Props
  declare __view_type__: TextAnnotationView

  constructor(attrs?: Partial<TextAnnotation.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TextAnnotation.Props>(() => ({
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
    }))
  }
}
