import {empty, ul, li, span, div} from "core/dom"
import {zip} from "core/util/array"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import {Panel} from "./panel"
import {LayoutDOM} from "../layouts/layout_dom"

export class TabsView extends WidgetView {
  model: Tabs

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tabs.change, () => this.rebuild_child_views())
    this.connect(this.model.properties.active.change, () => this.render())
  }

  render(): void {
    super.render()
    empty(this.el)

    const len = this.model.tabs.length
    if (len == 0)
      return
    else if (this.model.active >= len)
      this.model.active = len - 1

    const tabs = this.model.tabs.map((tab, i) => li({}, span({data: {index: i}}, tab.title)))
    tabs[this.model.active].classList.add("bk-bs-active")
    const tabsEl = ul({class: ["bk-bs-nav", "bk-bs-nav-tabs"]}, tabs)
    this.el.appendChild(tabsEl)

    const panels = this.model.tabs.map((_tab) => div({class: "bk-bs-tab-pane"}))
    panels[this.model.active].classList.add("bk-bs-active")
    const panelsEl = div({class: "bk-bs-tab-content"}, panels)
    this.el.appendChild(panelsEl)

    tabsEl.addEventListener("click", (event) => {
      event.preventDefault()

      if (event.target != event.currentTarget) {
        const el = event.target as HTMLElement

        const old_active = this.model.active
        const new_active = parseInt(el.dataset.index!)

        if (old_active != new_active) {
          tabs[old_active].classList.remove("bk-bs-active")
          panels[old_active].classList.remove("bk-bs-active")

          tabs[new_active].classList.add("bk-bs-active")
          panels[new_active].classList.add("bk-bs-active")

          this.model.active = new_active
          if (this.model.callback != null)
            this.model.callback.execute(this.model)
        }
      }
    })

    for (const [child, panelEl] of zip(this.model.children, panels))
      panelEl.appendChild(this.child_views[child.id].el)
  }
}

export namespace Tabs {
  export interface Attrs extends Widget.Attrs {
    tabs: Panel[]
    active: number
    callback: any // XXX
  }

  export interface Props extends Widget.Props {
    tabs: p.Property<Panel[]>
    active: p.Property<number>
  }
}

export interface Tabs extends Tabs.Attrs {}

export class Tabs extends Widget {

  properties: Tabs.Props

  constructor(attrs?: Partial<Tabs.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Tabs"
    this.prototype.default_view = TabsView

    this.define({
      tabs:     [ p.Array,   [] ],
      active:   [ p.Number,  0  ],
      callback: [ p.Instance    ],
    })
  }

  get_layoutable_children(): LayoutDOM[] {
    return this.children
  }

  get children(): LayoutDOM[] {
    return this.tabs.map((tab) => tab.child)
  }
}

Tabs.initClass()
