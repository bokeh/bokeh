import type {ViewStorage, ViewOf} from "core/build_views"
import {build_views} from "core/build_views"
import type {StyleSheetLike} from "core/dom"
import {remove_at} from "core/util/array"
import {isString} from "core/util/types"
import {clamp} from "core/util/math"
import {Container} from "core/layout/grid"
import {Location} from "core/enums"
import type {Orientation} from "core/enums"
import type * as p from "core/properties"
import {UIComponent, cls} from "core/vdom"
import type {VNode} from "core/vdom"
import type {Keys} from "core/dom"

import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {TabPanel} from "./tab_panel"
import {GridAlignmentLayout} from "./alignments"
import type {UIElement} from "../ui/ui_element"
import {Tooltip} from "../ui/tooltip"
import {HTML} from "../dom/html"
import {Model} from "model"

import * as tabs_css from "styles/tabs.css"
import * as icons_css from "styles/icons.css"

import {computed} from "@preact/signals"

export class TabsView extends LayoutDOMView {
  declare readonly model: Tabs
  declare readonly signals: p.SignalsOf<Tabs.Props>
  declare readonly values: Tabs.Attrs

  protected tooltip_views: ViewStorage<Tooltip> = new Map()
  protected readonly _materialized_tabs: Set<UIElement> = new Set()

  override connect_signals(): void {
    super.connect_signals()
    const {active, link_layouts, tabs} = this.model.properties

    this.on_change([active, link_layouts], async () => {
      await this.update_children()
    })

    this.on_transitive_change(tabs, async () => {
      await this.update_children()
    }, {signal: (obj) => (obj as TabPanel).properties.child.change})

    this.on_transitive_change(tabs, async () => {
      await this.build_tooltip_views()
    }, {signal: (obj) => (obj as TabPanel).properties.tooltip.change})
  }

  async build_tooltip_views(): Promise<void> {
    const {tabs} = this.values
    const tooltips = tabs.map((tab) => tab.tooltip).filter((tt) => tt instanceof Model).map((tt) => {
      return tt instanceof HTML ? new Tooltip({content: tt, position: "bottom_center" /* TODO "auto" */}) : tt
    })
    await build_views(this.tooltip_views, tooltips, {parent: this})
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_tooltip_views()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tabs_css.default, icons_css.default]
  }

  get child_models(): UIElement[] {
    const {link_layouts, tabs} = this.model
    if (link_layouts) {
      return tabs.map((tab) => tab.child)
    } else if (tabs.length == 0) {
      this._materialized_tabs.clear()
      return []
    } else {
      const children = tabs.map((tab) => tab.child)
      const current = new Set(children)
      for (const child of this._materialized_tabs) {
        if (!current.has(child)) {
          this._materialized_tabs.delete(child)
        }
      }

      this._materialized_tabs.add(tabs[this.normalized_active].child)
      return children.filter((child) => this._materialized_tabs.has(child))
    }
  }

  override _update_layout(): void {
    super._update_layout()

    if (this.model.link_layouts) {
      const layoutable = new Container<LayoutDOMView>()

      for (const view of this.child_views) {
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
  }

  private readonly _tabs_orientation = computed(() => {
    switch (this.values.tabs_location) {
      case "left":
      case "right":
        return "vertical"
      case "above":
      case "below":
        return "horizontal"
    }
  })
  get tabs_orientation(): Orientation {
    return this._tabs_orientation.value
  }

  _normalize_active(i: number): number {
    const {tabs} = this.values
    const n = tabs.length
    const j = (() => {
      if (i < 0) {
        return n + i
      } else if (i >= n) {
        return i - n
      } else {
        return i
      }
    })()
    return clamp(j, 0, n - 1)
  }

  private readonly _normalized_active = computed(() => {
    return this._normalize_active(this.values.active)
  })
  get normalized_active(): number {
    return this._normalized_active.value
  }

  override component(): VNode {
    const {disabled, tabs_location, tabs} = this.values
    const active = this.normalized_active

    const location_cls = tabs_css[tabs_location]

    const find_activable = (tabs_array: TabPanel[], i: number, dir: -1 | 1): number | null => {
      const n = tabs_array.length
      if (dir == 1) {
        for (let j = i; j < n; j++) {
          if (!tabs_array[j].disabled) {
            return j
          }
        }
        for (let j = 0; j < i; j++) {
          if (!tabs_array[j].disabled) {
            return j
          }
        }
      } else {
        for (let j = i; j >= 0; j--) {
          if (!tabs_array[j].disabled) {
            return j
          }
        }
        for (let j = n - 1; j >= i; j--) {
          if (!tabs_array[j].disabled) {
            return j
          }
        }
      }
      return null
    }

    const header_els = tabs.map((tab, i) => {
      const is_active = i == active
      const active_cls = is_active ? tabs_css.active : null

      const is_disabled = disabled || tab.properties.disabled.signal.value
      const disabled_cls = is_disabled ? tabs_css.disabled : null

      const closable = tab.properties.closable.signal.value

      const close_tab = (j: number = i) => {
        const new_tabs = remove_at(tabs, j)

        const new_active = (() => {
          if (new_tabs.length == 0) {
            return 0
          } else if (j < active) {
            return active - 1
          } else if (j == active) {
            const dir = j == new_tabs.length ? -1 : 1
            const start = dir == -1 ? j - 1 : j
            return find_activable(new_tabs, start, dir) ?? 0
          } else {
            return active
          }
        })()

        this.model.active = new_active
        this.model.tabs = new_tabs
      }

      const close_el = (() => {
        if (closable) {
          const on_close = (event: MouseEvent) => {
            if (event.target == event.currentTarget) {
              close_tab()
            }
          }
          return <div class={tabs_css.close} onClick={on_close}></div>
        } else {
          return null
        }
      })()

      const tooltip = tab.properties.tooltip.signal.value
      let description: string | undefined
      let tooltip_view: ViewOf<Tooltip> | undefined
      if (isString(tooltip)) {
        description = tooltip
      } else if (tooltip instanceof Tooltip) {
        tooltip_view = this.tooltip_views.get(tooltip)
      } else if (tooltip instanceof HTML) {
        for (const [tt, tv] of this.tooltip_views.entries()) {
          if (tt.content === tooltip) {
            tooltip_view = tv
            break
          }
        }
      }

      const toggle_tooltip = (visible: boolean) => {
        if (tooltip_view != null) {
          tooltip_view.model.visible = visible
        }
      }

      const toggle_tab = (j: number = i) => {
        this.model.active = this._normalize_active(j)
      }

      const on_click = (event: MouseEvent) => {
        if (is_disabled) {
          return
        }
        if (event.target == event.currentTarget) {
          toggle_tab()
        }
      }

      const on_key = (event: KeyboardEvent) => {
        if (is_disabled) {
          return
        }

        switch (event.key as Keys) {
          case " ":
          case "Enter": {
            toggle_tab()
            break
          }
          case "Delete": {
            if (closable) {
              close_tab()
            }
            break
          }
          case "ArrowLeft": {
            if (this.tabs_orientation == "horizontal") {
              toggle_tab(find_activable(tabs, i-1, -1) ?? active)
            }
            break
          }
          case "ArrowRight": {
            if (this.tabs_orientation == "horizontal") {
              toggle_tab(find_activable(tabs, i+1, +1) ?? active)
            }
            break
          }
          case "ArrowUp": {
            if (this.tabs_orientation == "vertical") {
              toggle_tab(find_activable(tabs, i-1, -1) ?? active)
            }
            break
          }
          case "ArrowDown": {
            if (this.tabs_orientation == "vertical") {
              toggle_tab(find_activable(tabs, i+1, +1) ?? active)
            }
            break
          }
          case "Home": {
            toggle_tab(find_activable(tabs, 0, +1) ?? active)
            break
          }
          case "End": {
            toggle_tab(find_activable(tabs, tabs.length-1, -1) ?? active)
            break
          }
          default:
        }
      }

      const ref = (el: HTMLElement | null) => {
        if (el != null) {
          if (active == i) {
            el.focus()
          }
          if (tooltip_view != null) {
            tooltip_view.model.target = el
          }
        }
      }

      return (
        <div
          class={cls(tabs_css.tab, active_cls, disabled_cls)}
          role="tab"
          tabIndex={is_disabled ? undefined : 0}
          aria-selected={is_active ? "true" : "false"}
          title={description}
          onClick={(event) => on_click(event)}
          onKeyUp={(event) => on_key(event)}
          onMouseEnter={() => toggle_tooltip(true)}
          onMouseLeave={() => toggle_tooltip(false)}
          ref={ref}
        >
          <span data-title={tab.title}><span>{tab.title}</span></span>
          {close_el}
        </div>
      )
    })

    const child_views = this.sig_child_views
    const panel_els = tabs.map((tab, i) => {
      const is_active = i == active
      const active_cls = is_active ? tabs_css.active : null
      const view = child_views.find((view) => view.model == tab.child)

      const ref = (el: HTMLElement | null) => {
        if (el != null && view != null) {
          view.render_to(el)
          view.r_after_render()
        }
      }

      return <div role="tabpanel" class={cls(tabs_css.panel, active_cls)} ref={ref}/>
    })

    return (
      <UIComponent parent={this.resolved_props} class={location_cls}>
        <div class={tabs_css.header}>
          <div class={tabs_css.headers_wrapper} role="tablist" aria-orientation={this.tabs_orientation}>
            {header_els}
          </div>
        </div>
        {panel_els}
      </UIComponent>
    )
  }
}

export namespace Tabs {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    tabs: p.Property<TabPanel[]>
    tabs_location: p.Property<Location>
    active: p.Property<number>
    link_layouts: p.Property<boolean>
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

    this.define<Tabs.Props>(({Int, List, Ref, Bool}) => ({
      tabs:          [ List(Ref(TabPanel)), [] ],
      tabs_location: [ Location, "above" ],
      active:        [ Int, 0 ],
      link_layouts:  [ Bool, false ],
    }))
  }
}
