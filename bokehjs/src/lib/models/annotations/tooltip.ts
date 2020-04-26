import {Annotation, AnnotationView} from "./annotation"
import {TooltipAttachment, Side} from "core/enums"
import {div, display, undisplay, empty, remove} from "core/dom"
import * as p from "core/properties"

import {bk_tooltip, bk_tooltip_custom, bk_tooltip_arrow} from "styles/tooltips"
import {bk_left, bk_right, bk_above, bk_below} from "styles/mixins"

import tooltips_css from "styles/tooltips.css"

export function compute_side(attachment: TooltipAttachment, sx: number, sy: number, hcenter: number, vcenter: number): Side {
  switch (attachment) {
    case "horizontal":
      return sx < hcenter ? "right" : "left"
    case "vertical":
      return sy < vcenter ? "below" : "above"
    default:
      return attachment
  }
}

export class TooltipView extends AnnotationView {
  model: Tooltip

  protected el: HTMLElement

  initialize(): void {
    super.initialize()
    // TODO (bev) really probably need multiple divs
    this.el = div({class: bk_tooltip})
    undisplay(this.el)
    this.plot_view.canvas_view.add_overlay(this.el)
  }

  remove(): void {
    remove(this.el)
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.data.change, () => this._draw_tips())
  }

  styles(): string[] {
    return [...super.styles(), tooltips_css]
  }

  render(): void {
    if (!this.model.visible)
      return

    this._draw_tips()
  }

  protected _draw_tips(): void {
    const {data} = this.model
    empty(this.el)
    undisplay(this.el)

    if (this.model.custom)
      this.el.classList.add(bk_tooltip_custom)
    else
      this.el.classList.remove(bk_tooltip_custom)

    if (data.length == 0)
      return

    const {frame} = this.plot_view

    for (const [sx, sy, content] of data) {
      if (this.model.inner_only && !frame.bbox.contains(sx, sy))
        continue

      const tip = div({}, content)
      this.el.appendChild(tip)
    }

    const [sx, sy] = data[data.length - 1] // XXX: this previously depended on {sx, sy} leaking from the for-loop

    const side = compute_side(this.model.attachment, sx, sy, frame._hcenter.value, frame._vcenter.value)

    this.el.classList.remove(bk_right)
    this.el.classList.remove(bk_left)
    this.el.classList.remove(bk_above)
    this.el.classList.remove(bk_below)

    const arrow_size = 10  // XXX: keep in sync with less

    display(this.el)  // XXX: {offset,client}Width() gives 0 when display="none"

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class ".bk-left" is relative to the tooltip itself
    let top: number
    let left = 0
    let right = 0

    switch (side) {
      case "right":
        this.el.classList.add(bk_left)
        left = sx + (this.el.offsetWidth - this.el.clientWidth) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "left":
        this.el.classList.add(bk_right)
        right = (this.plot_view.layout.bbox.width - sx) + arrow_size
        top = sy - this.el.offsetHeight/2
        break
      case "below":
        this.el.classList.add(bk_above)
        top = sy + (this.el.offsetHeight - this.el.clientHeight) + arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
      case "above":
        this.el.classList.add(bk_below)
        top = sy - this.el.offsetHeight - arrow_size
        left = Math.round(sx - this.el.offsetWidth/2)
        break
    }

    if (this.model.show_arrow)
      this.el.classList.add(bk_tooltip_arrow)

    // TODO (bev) this is not currently bulletproof. If there are
    // two hits, not colocated and one is off the screen, that can
    // be problematic
    if (this.el.childNodes.length > 0) {
      this.el.style.top = `${top}px`
      this.el.style.left = left ? `${left}px` : 'auto'
      this.el.style.right = right ? `${right}px` : 'auto'
    } else
      undisplay(this.el)
  }
}

export namespace Tooltip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    attachment: p.Property<TooltipAttachment>
    inner_only: p.Property<boolean>
    show_arrow: p.Property<boolean>
    data: p.Property<[number, number, HTMLElement][]>
    custom: p.Property<boolean>
  }
}

export interface Tooltip extends Tooltip.Attrs {}

export class Tooltip extends Annotation {
  properties: Tooltip.Props
  __view_type__: TooltipView

  constructor(attrs?: Partial<Tooltip.Attrs>) {
    super(attrs)
  }

  static init_Tooltip(): void {
    this.prototype.default_view = TooltipView

    this.define<Tooltip.Props>({
      attachment: [ p.TooltipAttachment, 'horizontal' ],
      inner_only: [ p.Boolean,           true         ],
      show_arrow: [ p.Boolean,           true         ],
    })

    this.override({
      level: 'overlay',
    })

    this.internal({
      data:   [ p.Any, [] ],
      custom: [ p.Any     ],
    })
  }

  clear(): void {
    this.data = []
  }

  add(sx: number, sy: number, content: HTMLElement): void {
    this.data = this.data.concat([[sx, sy, content]])
  }
}
