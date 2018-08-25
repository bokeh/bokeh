import {Grid, Row, Column, FixedLayout, Layoutable} from "core/layout"
//import {empty, ul, li, span, div} from "core/dom"
import {Location} from "core/enums"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Model} from "../../model"

export class TabsView extends LayoutDOMView {
  model: Tabs
  layout: Grid

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tabs.change, () => this.rebuild_child_views())
    this.connect(this.model.properties.active.change, () => this.render())
  }

  get child_models(): LayoutDOM[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  update_layout(): void {
    const header_items = this.child_models.map((_child) => new FixedLayout(70, 30))

    const loc = this.model.tabs_location

    let header: Layoutable
    let hrow: number, prow: number
    let hcol: number, pcol: number

    if (loc == "above" || loc == "below") {
      header = new Row(header_items)
      header.sizing = {width_policy: "max", height_policy: "min"}
      if (loc == "above")
        [hrow, prow] = [0, 1]
      else
        [hrow, prow] = [1, 0]
      hcol = pcol = 0
    } else {
      header = new Column(header_items)
      header.sizing = {width_policy: "min", height_policy: "max"}
      hrow = prow = 0
      if (loc == "left")
        [hcol, pcol] = [0, 1]
      else
        [hcol, pcol] = [1, 0]
    }

    const header_item = {layout: header, row: hrow, col: hcol}

    const panel_items = this.child_views.map((child_view) => {
      return {layout: child_view.layout, row: prow, col: pcol}
    })

    this.layout = new Grid()
    this.layout.sizing = this.box_sizing()
    this.layout.items = [header_item].concat(panel_items)
  }

  update_position(): void {
    super.update_position()
  }

  render(): void {
    super.render()
    //empty(this.el)

    const len = this.model.tabs.length
    if (len == 0)
      return
    else if (this.model.active >= len)
      this.model.active = len - 1

    //const tabs = this.model.tabs.map((tab, i) => div(, tab.title))

    /*
    const tabs = this.model.tabs.map((tab, i) => li({}, span({data: {index: i}}, tab.title)))
    tabs[this.model.active].classList.add("bk-active")
    const tabsEl = ul(tabs)
    this.el.appendChild(tabsEl)

    const panels = this.model.tabs.map((_tab) => div())
    panels[this.model.active].classList.add("bk-active")
    const panelsEl = div(panels)
    this.el.appendChild(panelsEl)

    tabsEl.addEventListener("click", (event) => {
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
   */
  }
}

export namespace Tabs {
  export interface Attrs extends LayoutDOM.Attrs {
    tabs: Panel[]
    tabs_location: Location
    active: number
    callback: any // XXX
  }

  export interface Props extends LayoutDOM.Props {
    tabs: p.Property<Panel[]>
    tabs_location: p.Property<Location>
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
      tabs:          [ p.Array,    []      ],
      tabs_location: [ p.Location, "above" ],
      active:        [ p.Number,   0       ],
      callback:      [ p.Instance          ],
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
