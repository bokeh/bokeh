import type {ViewStorage} from "core/build_views"
import {build_views} from "core/build_views"
import type {StyleSheetLike} from "core/dom"
import {div, show, hide, empty} from "core/dom"
import {remove_at} from "core/util/array"
import {Container} from "core/layout/grid"
import {Location} from "core/enums"
import type * as p from "core/properties"

import type {FullDisplay} from "./layout_dom"
import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {TabPanel} from "./tab_panel"
import {GridAlignmentLayout} from "./alignments"
import type {UIElement} from "../ui/ui_element"
import type {Tooltip} from "../ui/tooltip"

import tabs_css, * as tabs from "styles/tabs.css"
import icons_css from "styles/icons.css"

export class TabsView extends LayoutDOMView {
  declare model: Tabs

  protected tooltip_views: ViewStorage<Tooltip> = new Map()
  protected header_el: HTMLElement
  protected header_els: HTMLElement[]

  override connect_signals(): void {
    super.connect_signals()
    const {tabs, active} = this.model.properties
    this.on_change(tabs, async () => {
      this._update_headers()
      await this.update_children()
    })
    this.on_change(active, () => {
      this.update_active()
    })
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {tabs} = this.model
    const tooltips = tabs.map((tab) => tab.tooltip).filter((tt) => tt != null)
    await build_views(this.tooltip_views, tooltips, {parent: this})
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tabs_css, icons_css]
  }

  get child_models(): UIElement[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "grid"}
  }

  override _update_layout(): void {
    super._update_layout()

    const loc = this.model.tabs_location
    this.class_list.remove([...Location].map((loc) => tabs[loc]))
    this.class_list.add(tabs[loc])

    const layoutable = new Container<LayoutDOMView>()

    for (const view of this.child_views) {
      view.style.append(":host", {grid_area: "stack"})

      if (view instanceof LayoutDOMView && view.layout != null) {
        layoutable.add({r0: 0, c0: 0, r1: 1, c1: 1}, view)
      }
    }

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }

  override _after_layout(): void {
    super._after_layout()

    const {child_views} = this
    for (const child_view of child_views) {
      hide(child_view.el)
    }

    const {active} = this.model
    if (active in child_views) {
      const tab = child_views[active]
      show(tab.el)
    }
  }

  override render(): void {
    super.render()

    this.header_el = div({class: tabs.header})
    this.shadow_el.append(this.header_el)
    this._update_headers()
  }

  protected _update_headers(): void {
    const {active} = this.model

    const headers = this.model.tabs.map((tab, i) => {
      const tab_el = div({class: [tabs.tab, i == active ? tabs.active : null], tabIndex: 0}, tab.title)
      tab_el.addEventListener("click", (event) => {
        if (this.model.disabled) {
          return
        }
        if (event.target == event.currentTarget) {
          this.change_active(i)
        }
      })

      const tooltip_view = tab.tooltip != null ? this.tooltip_views.get(tab.tooltip) : null
      if (tooltip_view != null) {
        tooltip_view.model.target = tab_el

        const toggle_tooltip = (visible: boolean) => {
          tooltip_view.model.visible = visible
        }

        tab_el.addEventListener("mouseenter", () => {
          toggle_tooltip(true)
        })
        tab_el.addEventListener("mouseleave", () => {
          toggle_tooltip(false)
        })
      }

      if (tab.closable) {
        const close_el = div({class: tabs.close})
        close_el.addEventListener("click", (event) => {
          if (event.target == event.currentTarget) {
            this.model.tabs = remove_at(this.model.tabs, i)

            const ntabs = this.model.tabs.length
            if (this.model.active > ntabs - 1) {
              this.model.active = ntabs - 1
            }
          }
        })
        tab_el.appendChild(close_el)
      }

      if (this.model.disabled || tab.disabled) {
        tab_el.classList.add(tabs.disabled)
      }

      return tab_el
    })

    this.header_els = headers
    empty(this.header_el)
    this.header_el.append(...headers)
  }

  change_active(i: number): void {
    if (i != this.model.active) {
      this.model.active = i
    }
  }

  update_active(): void {
    const i = this.model.active

    const {header_els} = this
    for (const el of header_els) {
      el.classList.remove(tabs.active)
    }

    if (i in header_els) {
      header_els[i].classList.add(tabs.active)
    }

    const {child_views} = this
    for (const child_view of child_views) {
      hide(child_view.el)
    }

    if (i in child_views) {
      show(child_views[i].el)
    }
  }
}

export namespace Tabs {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    tabs: p.Property<TabPanel[]>
    tabs_location: p.Property<Location>
    active: p.Property<number>
  }
}

export interface Tabs extends Tabs.Attrs {}

export class Tabs extends LayoutDOM {
  declare properties: Tabs.Props
  declare __view_type__: TabsView

  constructor(attrs?: Partial<Tabs.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TabsView

    this.define<Tabs.Props>(({Int, List, Ref}) => ({
      tabs:          [ List(Ref(TabPanel)), [] ],
      tabs_location: [ Location, "above" ],
      active:        [ Int, 0 ],
    }))
  }
}
