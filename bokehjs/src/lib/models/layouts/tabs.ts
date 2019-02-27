import {Grid, Row, Column, ContentBox, Layoutable} from "core/layout"
import {div, children, position, show, hide} from "core/dom"
import {Location} from "core/enums"
import * as p from "core/properties"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {CallbackLike0} from "../callbacks/callback"
import {Model} from "../../model"

export class TabsView extends LayoutDOMView {
  model: Tabs

  protected header: Layoutable
  protected header_el: HTMLElement
  protected headers: Layoutable[]
  protected headers_el: HTMLElement[]

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

    this.headers = this.headers_el.map((el) => {
      const layout = new ContentBox(el)
      layout.set_sizing({width_policy: "fixed", height_policy: "fixed"})
      return layout
    })

    if (loc == "above" || loc == "below") {
      this.header = new Row(this.headers)
      this.header.set_sizing({width_policy: "fit", height_policy: "fixed"})
    } else {
      this.header = new Column(this.headers)
      this.header.set_sizing({width_policy: "fixed", height_policy: "fit"})
    }

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

    position(this.header_el, this.header.bbox)
    for (let i = 0; i < this.model.tabs.length; i++) {
      this.headers_el[i].style.position = "absolute" // XXX: do it in position()
      position(this.headers_el[i], this.headers[i].bbox)
    }

    const {child_views} = this
    for (const child_view of child_views)
      hide(child_view.el)

    show(child_views[this.model.active].el)
  }

  render(): void {
    super.render()

    const {active} = this.model

    this.headers_el =  this.model.tabs.map((tab, i) => {
      const el = div({class: ["bk-tab", i == active ? "bk-active" : null]}, tab.title)
      el.addEventListener("click", () => this.change_active(i))
      return el
    })

    this.header_el = div({class: "bk-tabs-header"}, this.headers_el)
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

    const headers = children(this.header_el)
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
