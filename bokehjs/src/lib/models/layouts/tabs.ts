import {Grid, ContentBox, Layoutable, Sizeable} from "core/layout"
import {div, position, size, scroll_size, show, hide, display, undisplay, children} from "core/dom"
import {sum, remove_at} from "core/util/array"
import {clamp} from "core/util/math"
import {Location} from "core/enums"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Panel} from "./panel"

import tabs_css, * as tabs from "styles/tabs.css"
import buttons_css, * as buttons from "styles/buttons.css"
import caret_css, * as caret from "styles/caret.css"

export class TabsView extends LayoutDOMView {
  override model: Tabs

  protected header: Layoutable

  protected header_el: HTMLElement
  protected wrapper_el: HTMLElement
  protected scroll_el: HTMLElement
  protected headers_el: HTMLElement
  protected left_el: HTMLElement
  protected right_el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tabs.change, () => this.rebuild())
    this.connect(this.model.properties.active.change, () => this.on_active_change())
  }

  override styles(): string[] {
    return [...super.styles(), tabs_css, buttons_css, caret_css]
  }

  get child_models(): LayoutDOM[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  override _update_layout(): void {
    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"

    // XXX: this is a hack, this should be handled by "fit" policy in grid layout
    const {scroll_el, headers_el} = this
    this.header = new class extends ContentBox {
      protected override _measure(viewport: Sizeable) {
        const min_headers = 3

        const scroll = size(scroll_el)
        const headers = children(headers_el).slice(0, min_headers).map((el) => size(el))

        const {width, height} = super._measure(viewport)
        if (vertical) {
          const min_width = scroll.width + sum(headers.map((size) => size.width))
          return {width: viewport.width != Infinity ? viewport.width : min_width, height}
        } else {
          const min_height = scroll.height + sum(headers.map((size) => size.height))
          return {width, height: viewport.height != Infinity ? viewport.height : min_height}
        }
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

  override update_position(): void {
    super.update_position()

    this.header_el.style.position = "absolute" // XXX: do it in position()
    position(this.header_el, this.header.bbox)

    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"

    const scroll_el_size = size(this.scroll_el)
    const headers_el_size = scroll_size(this.headers_el)
    if (vertical) {
      const {width} = this.header.bbox
      if (headers_el_size.width > width) {
        this.wrapper_el.style.maxWidth = `${width - scroll_el_size.width}px`
        display(this.scroll_el)
        this.do_scroll(this.model.active)
      } else {
        this.wrapper_el.style.maxWidth = ""
        undisplay(this.scroll_el)
      }
    } else {
      const {height} = this.header.bbox
      if (headers_el_size.height > height) {
        this.wrapper_el.style.maxHeight = `${height - scroll_el_size.height}px`
        display(this.scroll_el)
        this.do_scroll(this.model.active)
      } else {
        this.wrapper_el.style.maxHeight = ""
        undisplay(this.scroll_el)
      }
    }

    const {child_views} = this
    for (const child_view of child_views)
      hide(child_view.el)

    const {active} = this.model
    if (active in child_views) {
      const tab = child_views[active]
      show(tab.el)
    }
  }

  override render(): void {
    super.render()

    const {active} = this.model

    const headers = this.model.tabs.map((tab, i) => {
      const el = div({class: [tabs.tab, i == active ? tabs.active : null]}, tab.title)
      el.addEventListener("click", (event) => {
        if (this.model.disabled)
          return
        if (event.target == event.currentTarget)
          this.change_active(i)
      })
      if (tab.closable) {
        const close_el = div({class: tabs.close})
        close_el.addEventListener("click", (event) => {
          if (event.target == event.currentTarget) {
            this.model.tabs = remove_at(this.model.tabs, i)

            const ntabs = this.model.tabs.length
            if (this.model.active > ntabs - 1)
              this.model.active = ntabs - 1
          }
        })
        el.appendChild(close_el)
      }
      if (this.model.disabled || tab.disabled) {
        el.classList.add(tabs.disabled)
      }
      return el
    })
    this.headers_el = div({class: [tabs.headers]}, headers)
    this.wrapper_el = div({class: tabs.headers_wrapper}, this.headers_el)

    this.left_el = div({class: [buttons.btn, buttons.btn_default], disabled: ""}, div({class: [caret.caret, tabs.left]}))
    this.right_el = div({class: [buttons.btn, buttons.btn_default]}, div({class: [caret.caret, tabs.right]}))

    this.left_el.addEventListener("click", () => this.do_scroll("left"))
    this.right_el.addEventListener("click", () => this.do_scroll("right"))

    this.scroll_el = div({class: buttons.btn_group}, this.left_el, this.right_el)

    const loc = this.model.tabs_location
    this.header_el = div({class: [tabs.tabs_header, tabs[loc]]}, this.scroll_el, this.wrapper_el)
    this.shadow_el.appendChild(this.header_el)
  }

  private _scroll_index = 0
  protected do_scroll(target: "left" | "right" | number): void {
    const ntabs = this.model.tabs.length

    if (target == "left")
      this._scroll_index -= 1
    else if (target == "right")
      this._scroll_index += 1
    else
      this._scroll_index = target

    this._scroll_index = clamp(this._scroll_index, 0, ntabs - 1)

    if (this._scroll_index == 0)
      this.left_el.setAttribute("disabled", "")
    else
      this.left_el.removeAttribute("disabled")

    if (this._scroll_index == ntabs - 1)
      this.right_el.setAttribute("disabled", "")
    else
      this.right_el.removeAttribute("disabled")

    const sizes = children(this.headers_el)
      .slice(0, this._scroll_index)
      .map((el) => el.getBoundingClientRect())

    const loc = this.model.tabs_location
    const vertical = loc == "above" || loc == "below"

    if (vertical) {
      const left = -sum(sizes.map((size) => size.width))
      this.headers_el.style.left = `${left}px`
    } else {
      const top = -sum(sizes.map((size) => size.height))
      this.headers_el.style.top = `${top}px`
    }
  }

  change_active(i: number): void {
    if (i != this.model.active) {
      this.model.active = i
    }
  }

  on_active_change(): void {
    const i = this.model.active

    const headers = children(this.headers_el)
    for (const el of headers)
      el.classList.remove(tabs.active)

    headers[i].classList.add(tabs.active)

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
  }
}

export interface Tabs extends Tabs.Attrs {}

export class Tabs extends LayoutDOM {
  override properties: Tabs.Props
  override __view_type__: TabsView

  constructor(attrs?: Partial<Tabs.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TabsView

    this.define<Tabs.Props>(({Int, Array, Ref}) => ({
      tabs:          [ Array(Ref(Panel)), [] ],
      tabs_location: [ Location, "above" ],
      active:        [ Int, 0 ],
    }))
  }
}
