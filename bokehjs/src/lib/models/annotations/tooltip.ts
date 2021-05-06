import {Annotation, AnnotationView} from "./annotation"
import {TooltipAttachment} from "core/enums"
import {div, style, display, undisplay, empty, remove, classes} from "core/dom"
import * as p from "core/properties"

import tooltips_css, * as tooltips from "styles/tooltips.css"
import base_css from "styles/base.css"

const arrow_size = 10  // XXX: keep in sync with less

export class TooltipView extends AnnotationView {
  override model: Tooltip

  protected el: HTMLElement
  protected shadow_el: ShadowRoot
  protected stylesheet_el: HTMLStyleElement

  override initialize(): void {
    super.initialize()
    this.el = div()
    this.shadow_el = this.el.attachShadow({mode: "open"})
    this.stylesheet_el = style({}, ...this.styles())
    this.shadow_el.appendChild(this.stylesheet_el)
    undisplay(this.el)
    this.plot_view.canvas_view.add_overlay(this.el)
  }

  empty(): void {
    empty(this.shadow_el)
    this.shadow_el.appendChild(this.stylesheet_el)
  }

  override remove(): void {
    remove(this.el)
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.content.change, () => this.render())
    this.connect(this.model.properties.position.change, () => this._reposition())
  }

  override styles(): string[] {
    return [/*...super.styles(),*/ base_css, tooltips_css]
  }

  override render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  protected _render(): void {
    const {content} = this.model

    this.empty()
    classes(this.el).toggle("bk-tooltip-custom", this.model.custom)
    this.shadow_el.appendChild(content)

    if (this.model.show_arrow)
      this.el.classList.add(tooltips.tooltip_arrow)
  }

  protected _reposition(): void {
    const {position} = this.model
    if (position == null) {
      undisplay(this.el)
      return
    }

    const [sx, sy] = position

    const side = (() => {
      const area = this.parent.layout.bbox.relative()
      const {attachment} = this.model
      switch (attachment) {
        case "horizontal":
          return sx < area.hcenter ? "right" : "left"
        case "vertical":
          return sy < area.vcenter ? "below" : "above"
        default:
          return attachment
      }
    })()

    this.el.classList.remove(tooltips.right)
    this.el.classList.remove(tooltips.left)
    this.el.classList.remove(tooltips.above)
    this.el.classList.remove(tooltips.below)

    display(this.el)  // XXX: {offset,client}Width() gives 0 when display="none"

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class ".bk-left" is relative to the tooltip itself
    let top: number
    let left: number | null = null
    let right: number | null = null

    switch (side) {
      case "right":
        this.el.classList.add(tooltips.left)
        left = sx + (this.el.offsetWidth - this.el.clientWidth) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "left":
        this.el.classList.add(tooltips.right)
        right = (this.plot_view.layout.bbox.width - sx) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "below":
        this.el.classList.add(tooltips.above)
        top = sy + (this.el.offsetHeight - this.el.clientHeight) + arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
      case "above":
        this.el.classList.add(tooltips.below)
        top = sy - this.el.offsetHeight - arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
    }

    this.el.style.top = `${top}px`
    this.el.style.left = left != null ? `${left}px` : "auto"
    this.el.style.right = right != null ? `${right}px` : "auto"
  }
}

export namespace Tooltip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    attachment: p.Property<TooltipAttachment>
    inner_only: p.Property<boolean>
    show_arrow: p.Property<boolean>
    position: p.Property<[number, number] | null>
    content: p.Property<HTMLElement>
    custom: p.Property<boolean>
  }
}

export interface Tooltip extends Tooltip.Attrs {}

export class Tooltip extends Annotation {
  override properties: Tooltip.Props
  override __view_type__: TooltipView

  constructor(attrs?: Partial<Tooltip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TooltipView

    this.define<Tooltip.Props>(({Boolean}) => ({
      attachment: [ TooltipAttachment, "horizontal" ],
      inner_only: [ Boolean, true ],
      show_arrow: [ Boolean, true ],
    }))

    this.internal<Tooltip.Props>(({Boolean, Number, Tuple, Ref, Nullable}) => ({
      position: [ Nullable(Tuple(Number, Number)), null ],
      content:  [ Ref(HTMLElement), () => div() ],
      custom:   [ Boolean ],
    }))

    this.override<Tooltip.Props>({
      level: "overlay",
    })
  }

  clear(): void {
    this.position = null
  }
}
