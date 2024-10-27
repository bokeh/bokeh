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

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.paint(this.layer.ctx))
  }

  override paint(ctx: Context2d): void {
    if (!this.model.visible) {
      undisplay(this.el)
      return
    }

    super.paint(ctx)
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

    if (this.layout != null) {
      this.position.replace(`
      :host {
        position: relative;
      }
      `)
    } else {
      const panel = this.plot_view.frame
      const [rsx, rsy] = panel.bbox.relativize(sx, sy)

      this.position.replace(`
      :host {
        position: absolute;
        left: ${rsx}px;
        top: ${rsy}px;
      }
      `)
    }

    this.style.replace(`
    :host {
      width: max-content;
      height: max-content;

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

    if (this.layout != null) {
      if (angle != 0) {
        this.style.append(`
        :host {
          writing-mode: vertical-rl;
          rotate: 180deg;
          align-self: end;
        }
        `)
      }
    } else {
      const x_anchor = (() => {
        switch (this.visuals.text.text_align.get_value()) {
          case "left":   return "0%"
          case "center": return "50%"
          case "right":  return "100%"
        }
      })()
      const y_anchor = (() => {
        switch (this.visuals.text.text_baseline.get_value()) {
          case "top":    return "0%"
          case "middle": return "50%"
          case "bottom": return "100%"
          default:       return "50%"  // "baseline"
        }
      })()

      this.style.append(`
      :host {
        transform-origin: ${x_anchor} ${y_anchor};
        transform: translate(-${x_anchor}, -${y_anchor}) rotate(${angle}rad);
      }
      `)
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
