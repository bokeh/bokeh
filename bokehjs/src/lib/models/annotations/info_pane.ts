import {Annotation, AnnotationView} from "./annotation"
import {TooltipAttachment} from "core/enums"
import {div, display, undisplay, empty, remove, classes} from "core/dom"
import * as p from "core/properties"

import {bk_tooltip, bk_tooltip_custom, bk_tooltip_arrow} from "styles/tooltips"
import {bk_left, bk_right, bk_above, bk_below} from "styles/mixins"

import tooltips_css from "styles/tooltips.css"

export class InfoPaneView extends AnnotationView {
  model: InfoPane

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
    this.connect(this.model.properties.data.change, () => this.render())
    this.connect(this.model.properties.x_anchor.change, () => this.render())
    this.connect(this.model.properties.y_anchor.change, () => this.render())
  }

  styles(): string[] {
    return [...super.styles(), tooltips_css]
  }

  render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  protected _render(): void {
    empty(this.el)
    undisplay(this.el)

    classes(this.el).toggle(bk_tooltip_custom, this.model.custom)

    const {data} = this.model
    if (data.length == 0)
      return

    const {frame} = this.plot_view

    const x = this.model.x_anchor
    const y = this.model.y_anchor

   //will stack for multiple panes
   // for (const [x, y, content] of data) {
   //     if (this.model.inner_only && !frame.bbox.contains(x, y))
   //       continue
    //     const tip = div({}, content)
   //     this.el.appendChild(tip)
   //   }

    if (this.model.inner_only && !frame.bbox.contains(x, y)){
      const pane = div({}, data)
      this.el.appendChild(pane)
    }

    const {anchor} = this.model
    this.el.classList.remove(bk_right)
    this.el.classList.remove(bk_left)
    this.el.classList.remove(bk_above)
    this.el.classList.remove(bk_below)

    const arrow_size = 10  // XXX: keep in sync with less

    display(this.el)

   // slightly confusing: side "left" (for example) is relative to point that
   // is being annotated but CS class ".bk-left" is relative to the tooltip itself
    let top: number = 0
    let left = 0
    let right = 0

    switch (anchor) {
      case "left":
        this.el.classList.add(bk_right)
        left = x + (this.el.offsetWidth - this.el.clientWidth)
        top = y - this.el.offsetHeight/2
        break
      case "right":
        this.el.classList.add(bk_left)
        right = (this.plot_view.layout.bbox.width - x)
        top = y - this.el.offsetHeight/2
        break
      case "above":
        this.el.classList.add(bk_below)
        top = y + (this.el.offsetHeight - this.el.clientHeight) - arrow_size
        left = Math.round(x - this.el.offsetWidth/2)
        break
      case "below":
        this.el.classList.add(bk_above)
        top = y - this.el.offsetHeight + arrow_size
        left = Math.round(x - this.el.offsetWidth/2)
        break
    }

    if (this.model.show_arrow)
      this.el.classList.add(bk_tooltip_arrow)

    //might be not useful in the current context
    if (this.el.childNodes.length > 0) {
      this.el.style.top = `${top}px`
      this.el.style.left = left ? `${left}px` : 'auto'
      this.el.style.right = right ? `${right}px` : 'auto'
    } else
      undisplay(this.el)
  }
}

export namespace InfoPane {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    anchor: p.Property<TooltipAttachment>
    //can be ignored if inner_only property isnt useful
    inner_only: p.Property<boolean>
    show_arrow: p.Property<boolean>
    x_anchor: p.Property<number>
    y_anchor: p.Property<number>
    //data has to be able to get list of strings
    data: p.Property<string>
    custom: p.Property<boolean>
  }
}

export interface InfoPane extends InfoPane.Attrs {}

export class InfoPane extends Annotation {
  properties: InfoPane.Props
  __view_type__: InfoPaneView

  constructor(attrs?: Partial<InfoPane.Attrs>) {
    super(attrs)
  }

  static init_InfoPane(): void {
    this.prototype.default_view = InfoPaneView

    this.define<InfoPane.Props>({
      //is kept as is if the horizontal\vertical functionality shall come in use
      anchor: [ p.TooltipAttachment, 'horizontal' ],
      inner_only: [ p.Boolean,           true         ],
      show_arrow: [ p.Boolean,           true         ],
   })

    this.override({
      level: 'overlay',
    })

    this.internal({
      data:   [ p.Any, "" ],
      custom: [ p.Any     ],
    })
  }

  clear(): void {
    this.data = ""
  }

  add(x: number, y: number, content: string): void {
    this.data = this.data.concat(content)
    this.x_anchor = x
    this.y_anchor = y
  }
}
