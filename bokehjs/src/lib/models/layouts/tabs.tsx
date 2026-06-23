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

import type {FullDisplay} from "./layout_dom"
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

  override connect_signals(): void {
    super.connect_signals()
    /*
    const {tabs} = this.model.properties
    this.on_change(tabs, async () => {
      await this.update_children()
    })
    */
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {tabs} = this.model
    const tooltips = tabs.map((tab) => tab.tooltip).filter((tt) => tt instanceof Model).map((tt) => {
      return tt instanceof HTML ? new Tooltip({content: tt, position: "bottom_center" /* TODO "auto" */}) : tt
    })
    await build_views(this.tooltip_views, tooltips, {parent: this})
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), tabs_css.default, icons_css.default]
  }

  get child_models(): UIElement[] {
    return this.model.tabs.map((tab) => tab.child)
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "grid"}
  }

  override _update_layout(): void {
    super._update_layout()

    for (const view of this.child_views) {
      view.parent_style.append(":host", {grid_area: "stack"})
    }

    if (this.model.link_layouts) {
      const layoutable = new Container<LayoutDOMView>()

      for (const view of this.child_views) {
        view.parent_style.append(":host", {grid_area: "stack"})

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

  override component(): VNode {
    const {active, disabled, tabs_location, tabs} = this.values
    const location_cls = tabs_css[tabs_location]

    const header_els = tabs.map((tab, i) => {
      const is_active = i == active
      const active_cls = is_active ? tabs_css.active : null

      const is_disabled = disabled || tab.properties.disabled.signal.value
      const disabled_cls = is_disabled ? tabs_css.disabled : null

      const close_el = (() => {
        if (tab.properties.closable.signal.value) {
          const on_close = (event: MouseEvent) => {
            if (event.target == event.currentTarget) {
              this.model.tabs = remove_at(this.model.tabs, i)

              const ntabs = this.model.tabs.length
              if (this.model.active > ntabs - 1) {
                this.model.active = ntabs - 1
              }
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

      const toggle_tab = (i: number) => {
        if (!is_disabled) {
          this.model.active = clamp(i, 0, tabs.length-1)
        }
      }

      const on_key = (event: KeyboardEvent, i: number) => {
        switch (event.key as Keys) {
          case "Enter": {
            toggle_tab(i)
            break
          }
          case "ArrowLeft": {
            if (this.tabs_orientation == "horizontal") {
              toggle_tab(i - 1)
            }
            break
          }
          case "ArrowRight": {
            if (this.tabs_orientation == "horizontal") {
              toggle_tab(i + 1)
            }
            break
          }
          case "ArrowUp": {
            if (this.tabs_orientation == "vertical") {
              toggle_tab(i - 1)
            }
            break
          }
          case "ArrowDown": {
            if (this.tabs_orientation == "vertical") {
              toggle_tab(i + 1)
            }
            break
          }
          case "Home": {
            toggle_tab(0)
            break
          }
          case "End": {
            toggle_tab(tabs.length - 1)
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

      return <div
        class={cls(tabs_css.tab, active_cls, disabled_cls)}
        tabIndex={0}
        title={description}
        onClick={() => toggle_tab(i)}
        onKeyUp={(event) => on_key(event, i)}
        onMouseEnter={() => toggle_tooltip(true)}
        onMouseLeave={() => toggle_tooltip(false)}
        ref={ref}
      >
        {tab.title}
        {close_el}
      </div>
    })

    return (
      <UIComponent parent={this.resolved_props} class={location_cls}>
        <div class={tabs_css.header}>
          <div class={tabs_css.headers_wrapper}>
            {header_els}
          </div>
        </div>
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
