import {Annotation, AnnotationView} from "../annotation"
import type * as visuals from "core/visuals"
import {display, undisplay} from "core/dom"
import type * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import type {Context2d} from "core/util/canvas"
import {Padding, BorderRadius} from "../../common/kinds"
import * as resolve from "../../common/resolve"
import type {LRTB, Corners} from "core/util/bbox"

export abstract class TextAnnotationView extends AnnotationView {
  declare model: TextAnnotation
  declare visuals: TextAnnotation.Visuals

  protected text_el: Node

  override rendering_target(): HTMLElement {
    return this.plot_view.canvas_view.overlays_el
  }

  override update_layout(): void {
    const {panel} = this
    if (panel != null) {
      this.layout = new SideLayout(panel, () => this.get_size(), true)
    } else {
      this.layout = undefined
    }
  }

  override initialize(): void {
    super.initialize()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.paint())
  }

  override paint(): void {
    if (!this.model.visible) {
      undisplay(this.el)
      return
    }

    super.paint()
  }

  get padding(): LRTB<number> {
    return resolve.padding(this.model.padding)
  }

  get border_radius(): Corners<number> {
    return resolve.border_radius(this.model.border_radius)
  }

  override render(): void {
    super.render()
    this.text_el = document.createTextNode("")
    this.shadow_el.append(this.text_el)
  }

  protected _paint_text(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    const {el} = this
    undisplay(el)

    this.text_el.textContent = text
    this.visuals.text.set_value(ctx)

    const {padding, border_radius} = this

    this.position.replace(`
    :host {
      position: absolute;
      left: ${sx}px;
      top: ${sy}px;
    }
    `)

    this.style.replace(`
    :host {
      color: ${ctx.fillStyle};
      -webkit-text-stroke: 1px ${ctx.strokeStyle};
      font: ${ctx.font};
      white-space: pre;

      padding-left: ${padding.left}px;
      padding-right: ${padding.right}px;
      padding-top: ${padding.top}px;
      padding-bottom: ${padding.bottom}px;

      border-top-left-radius: ${border_radius.top_left}px;
      border-top-right-radius: ${border_radius.top_right}px;
      border-bottom-right-radius: ${border_radius.bottom_right}px;
      border-bottom-left-radius: ${border_radius.bottom_left}px;
    }
    `)

    const [x_anchor, x_t] = (() => {
      switch (this.visuals.text.text_align.get_value()) {
        case "left":   return ["left", "0%"]
        case "center": return ["center", "-50%"]
        case "right":  return ["right", "-100%"]
      }
    })()
    const [y_anchor, y_t] = (() => {
      switch (this.visuals.text.text_baseline.get_value()) {
        case "top":    return ["top", "0%"]
        case "middle": return ["center", "-50%"]
        case "bottom": return ["bottom", "-100%"]
        default:       return ["center", "-50%"]  // "baseline"
      }
    })()

    let transform = `translate(${x_t}, ${y_t})`
    if (angle != 0) {
      transform += ` rotate(${angle}rad)`
    }

    this.style.append(`
    :host {
      transform-origin: ${x_anchor} ${y_anchor};
      transform: ${transform};
    }
    `)

    if (this.layout == null) {
      // const {bbox} = this.plot_view.frame
      // const {left, right, top, bottom} = bbox
      // el.style.clipPath = ???
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      this.style.append(`
      :host {
        background-color: ${ctx.fillStyle};
      }
      `)
    }

    if (this.visuals.border_line.doit) {
      this.visuals.border_line.set_value(ctx)

      // attempt to support vector-style ("8 4 8") line dashing for css mode
      this.style.append(`
      :host {
        border-style: ${ctx.getLineDash().length < 2 ? "solid" : "dashed"};
        border-width: ${ctx.lineWidth}px;
        border-color: ${ctx.strokeStyle};
      }
      `)
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
