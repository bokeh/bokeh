import {Grid, ContentBox, Layoutable, Sizeable} from "core/layout"
import {div, position, size, scroll_size, show, hide, undisplay, children} from "core/dom"
import {sum} from "core/util/array"
import {Location} from "core/enums"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {CallbackLike0} from "../callbacks/callback"
import {Model} from "../../model"

export class TabsView extends LayoutDOMView {
  model: Tabs

  protected header: Layoutable

  protected header_el: HTMLElement
  protected wrapper_el: HTMLElement
  protected scroll_el: HTMLElement
  protected headers_el: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tabs.change, () => this.rebuild())
    this.connect(this.model.properties.active.change, () => this.on_active_change())
  }

  get child_models(): LayoutDOM[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  _update_layout(): void {
    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"

    // XXX: this is a hack, this should be handled by "fit" policy in grid layout
    this.header = new class extends ContentBox {
      protected _measure(viewport: Sizeable) {
        const {width, height} = super._measure(viewport)
        if (vertical)
          return {width: viewport.width != Infinity ? viewport.width : 0, height}
        else
          return {width, height: viewport.height != Infinity ? viewport.height : 0}
      }
    }(this.header_el)
    if (vertical)
      this.header.set_sizing({width_policy: "fit", height_policy: "fixed"})
    else
      this.header.set_sizing({width_policy: "fixed", height_policy: "fit"})

    let row = 1
    let col = 1
    switch (loc) {
      case "above": row -= 1; break
      case "below": row += 1; break
      case "left":  col -= 1; break
      case "right": col += 1; break
    }

    const header = {layout: this.header, row, col}

    const panels = this.child_views.map((child_view) => {
      return {layout: child_view.layout, row: 1, col: 1}
    })

    this.layout = new Grid([header, ...panels])
    this.layout.set_sizing(this.box_sizing())
  }

  update_position(): void {
    super.update_position()

    this.header_el.style.position = "absolute" // XXX: do it in position()
    position(this.header_el, this.header.bbox)

    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"

    const scroll_el_size = size(this.scroll_el)
    const headers_el_size = scroll_size(this.headers_el)
    if (vertical) {
      const {width} = this.header.bbox
      if (headers_el_size.width > width)
        this.wrapper_el.style.maxWidth = `${width - scroll_el_size.width}px`
      else
        undisplay(this.scroll_el)
    } else {
      const {height} = this.header.bbox
      if (headers_el_size.height > height)
        this.wrapper_el.style.maxHeight = `${height - scroll_el_size.height}px`
      else
        undisplay(this.scroll_el)
    }

    const {child_views} = this
    for (const child_view of child_views)
      hide(child_view.el)

    show(child_views[this.model.active].el)
  }

  render(): void {
    super.render()

    const {active} = this.model

    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"
    const location = `bk-${loc}`

    const headers = this.model.tabs.map((tab, i) => {
      const el = div({class: ["bk-tab", i == active ? "bk-active" : null]}, tab.title)
      el.addEventListener("click", () => this.change_active(i))
      return el
    })
    this.headers_el = div({class: ["bk-headers"]}, headers)
    this.wrapper_el = div({class: "bk-headers-wrapper"}, this.headers_el)

    const left_el = div({class: ["bk-btn", "bk-btn-default"], disabled: ""}, div({class: ["bk-caret", "bk-left"]}))
    const right_el = div({class: ["bk-btn", "bk-btn-default"]}, div({class: ["bk-caret", "bk-right"]}))

    let scroll_index = 0
    const do_scroll = (dir: "left" | "right") => {
      return () => {
        const ntabs = this.model.tabs.length

        if (dir == "left")
          scroll_index = Math.max(scroll_index - 1, 0)
        else
          scroll_index = Math.min(scroll_index + 1, ntabs - 1)

        if (scroll_index == 0)
          left_el.setAttribute("disabled", "")
        else
          left_el.removeAttribute("disabled")

        if (scroll_index == ntabs - 1)
          right_el.setAttribute("disabled", "")
        else
          right_el.removeAttribute("disabled")

        const sizes = children(this.headers_el)
          .slice(0, scroll_index)
          .map((el) => el.getBoundingClientRect())

        if (vertical) {
          const left = -sum(sizes.map((size) => size.width))
          this.headers_el.style.left = `${left}px`
        } else {
          const top = -sum(sizes.map((size) => size.height))
          this.headers_el.style.top = `${top}px`
        }
      }
    }

    left_el.addEventListener("click", do_scroll("left"))
    right_el.addEventListener("click", do_scroll("right"))

    this.scroll_el = div({class: "bk-btn-group"}, left_el, right_el)

    this.header_el = div({class: ["bk-tabs-header", location]}, this.scroll_el, this.wrapper_el)
    this.el.appendChild(this.header_el)
  }

  change_active(i: number): void {
    if (i != this.model.active) {
      this.model.active = i

      if (this.model.callback != null)
        this.model.callback.execute(this.model)
    }
  }

  on_active_change(): void {
    const i = this.model.active

    const headers = children(this.headers_el)
    for (const el of headers)
      el.classList.remove("bk-active")

    headers[i].classList.add("bk-active")

    const {child_views} = this
    for (const child_view of child_views)
      hide(child_view.el)

    show(child_views[i].el)
  }
}

export namespace Tabs {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    tabs: p.Property<Panel[]>
    tabs_location: p.Property<Location>
    active: p.Property<number>
    callback: p.Property<CallbackLike0<Tabs> | null>
  }
}

export interface Tabs extends Tabs.Attrs {}

export class Tabs extends LayoutDOM {
  properties: Tabs.Props

  constructor(attrs?: Partial<Tabs.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Tabs"
    this.prototype.default_view = TabsView

    this.define<Tabs.Props>({
      tabs:          [ p.Array,    []      ],
      tabs_location: [ p.Location, "above" ],
      active:        [ p.Number,   0       ],
      callback:      [ p.Any               ],
    })
  }
}
Tabs.initClass()

export namespace Panel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    title: p.Property<string>
    child: p.Property<LayoutDOM>
  }
}

export interface Panel extends Panel.Attrs {}

export class Panel extends Model {
  properties: Panel.Props

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Panel"

    this.define<Panel.Props>({
      title: [ p.String,  "" ],
      child: [ p.Instance    ],
    })
  }
}
Panel.initClass()
