import {Annotation, AnnotationView} from "../annotation"
import * as visuals from "core/visuals"
import {div, display, undisplay, remove} from "core/dom"
import * as p from "core/properties"
import {SideLayout} from "core/layout/side_panel"
import {Context2d} from "core/util/canvas"
import {build_view} from "core/build_views"
import {isString} from "core/util/types"
import {parse_delimited_string} from "models/text/utils"
import { default_provider, MathJaxProvider } from "models/text/providers"
import { BaseTextView } from "models/text/base_text"

export abstract class TextAnnotationView extends AnnotationView {
  override model: TextAnnotation
  override visuals: TextAnnotation.Visuals

  protected _text_view: BaseTextView

  get provider(): MathJaxProvider {
    return default_provider
  }

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

  protected async _init_text(): Promise<void> {
    const {text} = this.model
    const _text = isString(text) ? parse_delimited_string(text) : text
    this._text_view = await build_view(_text, {parent: this})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._init_text()
  }

  private contains_tex_string(): boolean {
    if (!this.provider.MathJax)
      return false

    return this.provider.MathJax.find_tex(this.model.text).length > 0
  };

  protected has_math_disabled() {
    return this.model.disable_math || !this.contains_tex_string()
  }

  override remove(): void {
    remove(this.el)
    this._text_view.remove()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {text} = this.model.properties
    this.on_change(text, async () => {
      this._text_view.remove()
      await this._init_text()
    })

    this.connect(this.model.change, () => this.render())
  }

  override render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  process_tex(): string {
    if (!this.provider.MathJax)
      return this.model.text

    const {text} = this.model
    const tex_parts = this.provider.MathJax.find_tex(text)
    const processed_text: string[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      processed_text.push(text.slice(last_index, part.start.n))
      processed_text.push(this.provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

      last_index = part.end.n
    }

    if (last_index! < text.length)
      processed_text.push(text.slice(last_index))

    return processed_text.join("")
  }

  protected _paint(ctx: Context2d, text: string, sx: number, sy: number, angle: number): void {
    const {el} = this
    undisplay(el)

    if (this.has_math_disabled())
      el.textContent = text
    else
      el.innerHTML = this.process_tex()

    this.visuals.text.set_value(ctx)

    el.style.position = "absolute"
    el.style.left = `${sx}px`
    el.style.top = `${sy}px`
    el.style.color = ctx.fillStyle as string
    el.style.font = ctx.font
    el.style.lineHeight = "normal" // needed to prevent ipynb css override
    el.style.whiteSpace = "pre"

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
    if (angle) {
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
      el.style.borderStyle = ctx.lineDash.length < 2 ? "solid" : "dashed"
      el.style.borderWidth = `${ctx.lineWidth}px`
      el.style.borderColor = ctx.strokeStyle as string
    }

    display(el)
  }
}

export namespace TextAnnotation {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Annotation.Props & {
    text: p.Property<string>
    disable_math: p.Property<boolean>
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

  static {
    this.define<TextAnnotation.Props>(({Boolean, String}) => ({
      text:  [ String, "" ],
      disable_math: [ Boolean, false ],
    }))
  }
}
