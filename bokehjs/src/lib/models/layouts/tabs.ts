import {StackedLayout} from "core/layout/alignments"
import {empty, ul, li, span, div} from "core/dom"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Model} from "../../model"

export class TabsView extends LayoutDOMView {
  model: Tabs
  layout: StackedLayout

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tabs.change, () => this.rebuild_child_views())
    this.connect(this.model.properties.active.change, () => this.render())
  }

  get child_models(): LayoutDOM[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  update_layout(): void {
    this.layout = new StackedLayout()
    this.layout.sizing = this.box_sizing
    this.layout.items = this.child_views.map((child_view) => child_view.layout)
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
    tabs[this.model.active].classList.add("bk-active")
    const tabsEl = ul(tabs)
    this.el.appendChild(tabsEl)

    const panels = this.model.tabs.map((_tab) => div())
    panels[this.model.active].classList.add("bk-active")
    const panelsEl = div(panels)
    this.el.appendChild(panelsEl)

    tabsEl.addEventListener("click", (event) => {
      event.preventDefault()

      if (event.target != event.currentTarget) {
        const el = event.target as HTMLElement

        const old_active = this.model.active
        const new_active = parseInt(el.dataset.index!)

        if (old_active != new_active) {
          tabs[old_active].classList.remove("bk-active")
          panels[old_active].classList.remove("bk-active")

          tabs[new_active].classList.add("bk-active")
          panels[new_active].classList.add("bk-active")

          this.model.active = new_active
          if (this.model.callback != null)
            this.model.callback.execute(this.model)
        }
      }
    })
  }
}

export namespace Tabs {
  export interface Attrs extends LayoutDOM.Attrs {
    tabs: Panel[]
    active: number
    callback: any // XXX
  }

  export interface Props extends LayoutDOM.Props {
    tabs: p.Property<Panel[]>
    active: p.Property<number>
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

    this.define({
      tabs:     [ p.Array,   [] ],
      active:   [ p.Number,  0  ],
      callback: [ p.Instance    ],
    })
  }
}
Tabs.initClass()

export namespace Panel {
  export interface Attrs extends Model.Attrs {
    title: string
    child: LayoutDOM
  }

  export interface Props extends Model.Props {}
}

export interface Panel extends Panel.Attrs {}

export class Panel extends Model {
  properties: Panel.Props

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Panel"

    this.define({
      title: [ p.String,  "" ],
      child: [ p.Instance    ],
    })
  }
}
Panel.initClass()
