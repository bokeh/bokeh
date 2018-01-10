/* XXX: partial */
import {empty, ul, li, span, div} from "core/dom"
import {zip} from "core/util/array"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

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

    const panels = this.model.tabs.map((tab) => div({class: "bk-bs-tab-pane"}))
    panels[this.model.active].classList.add("bk-bs-active")
    panelsEl = div({class: "bk-bs-tab-content"}, panels)
    this.el.appendChild(panelsEl)

    tabsEl.addEventListener("click", (event) => {
      event.preventDefault()

      if (event.target != event.currentTarget) {
        const el = event.target

        const old_active = this.model.active
        const new_active = parseInt(el.dataset.index)

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

export class Tabs extends Widget {

  get_layoutable_children(): LayoutDOM {
    return this.children
  }

  get children(): LayoutDOM {
    return this.tabs.map((tab) => tab.child)
  }
}

Tabs.prototype.type = "Tabs"
Tabs.prototype.default_view = TabsView

Tabs.define({
  tabs:     [ p.Array,   [] ],
  active:   [ p.Number,  0  ],
  callback: [ p.Instance    ],
})
