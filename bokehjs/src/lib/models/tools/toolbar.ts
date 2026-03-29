import type {StyleSheetLike, Keys} from "core/dom"
import {div} from "core/dom"
import type {ViewStorage, View, ViewOf} from "core/build_views"
import {build_view, build_views, remove_views} from "core/build_views"
import type * as p from "core/properties"
import {UIElement, UIElementView} from "../ui/ui_element"
import {LogoVariant, Location, ToolName} from "core/enums"
import {every, sort_by, includes, intersection, clear} from "core/util/array"
import {join, enumerate} from "core/util/iterator"
import type {Orientation} from "core/enums"
import {typed_keys, values, entries} from "core/util/object"
import {isArray} from "core/util/types"
import type {EventRole} from "./tool"
import {Tool} from "./tool"
import type {ToolLike} from "./tool_proxy"
import {ToolProxy} from "./tool_proxy"
import {ToolGroup} from "./tool_group"
import {ToolButton, ToolButtonView} from "./tool_button"
import {Divider} from "./divider"
import {Logo} from "./logo"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {Menu, DividerItem} from "../ui/menus"
import type {At} from "core/util/menus"
import {ContextMenu} from "core/util/menus"
import {Signal0} from "core/signaling"

import toolbars_css, * as toolbars from "styles/toolbar.css"
import icons_css from "styles/icons.css"

export class ToolbarView extends UIElementView {
  declare model: Toolbar

  get orientation(): Orientation {
    switch (this.model.location) {
      case "above":
      case "below":
        return "horizontal"
      case "left":
      case "right":
        return "vertical"
    }
  }

  get horizontal(): boolean {
    return this.orientation == "horizontal"
  }

  protected _bar_el: HTMLElement

  protected _logo_view: ViewOf<Logo> | null = null

  protected readonly _ui_element_views: ViewStorage<UIElement> = new Map()
  protected readonly _ui_element_menu_views: ViewStorage<UIElement> = new Map()
  protected _ui_elements: UIElement[]

  get ui_elements(): UIElement[] {
    return this._ui_elements
  }

  get ui_element_views(): UIElementView[] {
    return this._ui_elements.map((ui_element) => this._ui_element_views.get(ui_element)).filter((view) => view != null)
  }

  get ui_element_menu_views(): UIElementView[] {
    return this._ui_elements.map((ui_element) => this._ui_element_menu_views.get(ui_element)).filter((view) => view != null)
  }

  get tool_buttons(): ToolButton[] {
    return this.ui_elements.filter((item): item is ToolButton => item instanceof ToolButton)
  }

  get tool_button_views(): ToolButtonView[] {
    return this.ui_element_views.filter((item): item is ToolButtonView => item instanceof ToolButtonView)
  }

  protected _overflow_menu: ContextMenu
  protected _overflow_el: HTMLElement

  get overflow_el(): HTMLElement {
    return this._overflow_el
  }

  private _visible: boolean | null = null
  get visible(): boolean {
    return !this.model.visible ? false : (!this.model.autohide || (this._visible ?? false))
  }

  override children_views(): View[] {
    return [...super.children_views(), ...this._ui_element_views.values()]
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const child_view of this.ui_element_views.values()) {
      if (!child_view.has_finished()) {
        return false
      }
    }

    return true
  }

  override initialize(): void {
    super.initialize()

    const {location} = this.model
    const reversed = location == "left" || location == "above"
    this._overflow_menu = new ContextMenu([], {
      target: this.el,
      orientation: this.orientation, // == "horizontal" ? "vertical" : "horizontal",
      reversed,
      prevent_hide: (event) => {
        return event.composedPath().includes(this._overflow_el)
      },
      extra_styles: [
        ".bk-hidden { display: none; }",
      ],
    })
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_tool_button_views()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {children, tools, location, autohide, group, group_types} = this.model.properties
    this.on_change([children, tools, group, group_types], async () => {
      await this._build_tool_button_views()
      this.rerender()
    })

    this.on_change(location, () => {
      this.rerender()
    })

    this.on_change(autohide, () => {
      this._on_visible_change()
    })

    this.on_transitive_change(tools, () => {
      this.rerender()
    }, {
      signal: (obj) => obj.properties.visible.change,
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), toolbars_css, icons_css]
  }

  override remove(): void {
    this._logo_view?.remove()
    remove_views(this._ui_element_views)
    remove_views(this._ui_element_menu_views)
    this._destroy_proxies()
    super.remove()
  }

  // Manually keep track of view constructed ToolProxy models, because models don't
  // have any sensible life cycle management (at least from views' perspective).
  private readonly _our_proxies: ToolProxy<Tool>[] = []

  private _destroy_proxies(): void {
    for (const proxy of this._our_proxies) {
      proxy.destroy()
    }
    clear(this._our_proxies)
  }

  /**
   * Group similar tools into tool proxies.
   */
  private _group_tools(tools: ToolLike<Tool>[]): ToolLike<Tool>[] {
    const {group_types} = this.model
    const grouped: Map<string, ToolLike<Tool>[]> = new Map()
    for (const [tool, i] of enumerate(tools)) {
      const group_type = group_types.find((type) => Tool.is_alias_of(tool, type))
      if (group_type != null && tool.group !== false) {
        const key = tool.group === true ? tool.type : `${tool.type}_${tool.group}`
        const group = grouped.get(key)
        if (group != null) {
          group.push(tool)
        } else {
          grouped.set(key, [tool])
        }
      } else {
        // The key doesn't matter, just use something unique.
        grouped.set(`${i}`, [tool])
      }
    }
    return Array.from(grouped.values(), (group) => {
      if (group.length > 1) {
        const proxy = new ToolGroup({tools: group})
        this._our_proxies.push(proxy)
        return proxy
      } else {
        return group[0]
      }
    })
  }

  protected async _build_tool_button_views(): Promise<void> {
    this._destroy_proxies()

    const {children} = this.model
    if (children == "auto") {
      const tool_bars: ToolLike<Tool>[][] = [
        ...values(this.model.gestures).map((gesture) => gesture.tools),
        this.model.actions,
        this.model.inspectors,
        this.model.auxiliaries,
      ]

      const {group} = this.model
      const button_bars = tool_bars
        .map((bar) => {
          const grouped = group ? this._group_tools(bar) : bar
          return grouped.map((tool) => new ToolButton({tool}))
        })
        .filter((bar) => bar.length != 0)

      this._ui_elements = [...join(button_bars, () => new Divider())]
    } else {
      this._ui_elements = children.map((child) => child ?? new Divider())
    }

    await build_views(this._ui_element_views, this._ui_elements, {parent: this})
    await build_views(this._ui_element_menu_views, this._ui_elements, {parent: this})

    const {logo: variant} = this.model
    if (variant != null) {
      const logo = new Logo({variant})
      this._logo_view = await build_view(logo, {parent: this})
    } else {
      this._logo_view?.remove()
      this._logo_view = null
    }
  }

  set_visibility(visible: boolean): void {
    if (visible != this._visible) {
      this._visible = visible
      this._on_visible_change()
    }
  }

  protected _on_visible_change(): void {
    this.el.classList.toggle(toolbars.hidden, !this.visible)
  }

  protected _menu_at(): At {
    switch (this.model.location) {
      case "right": return {left_of:  this._overflow_el}
      case "left":  return {right_of: this._overflow_el}
      case "above": return {below: this._overflow_el}
      case "below": return {above: this._overflow_el}
    }
  }

  toggle_menu(): void {
    this._overflow_menu.toggle(this._menu_at())
  }

  override render(): void {
    super.render()
    clear(this._overflow_menu.items)

    this.el.classList.add(toolbars[this.model.location])
    this.el.classList.toggle(toolbars.inner, this.model.inner)
    this._on_visible_change()

    this._logo_view?.render_to(this.shadow_el)

    this._overflow_el = div({class: toolbars.overflow, tabIndex: 0}, div({class: toolbars.icon}))
    this._overflow_el.addEventListener("click", () => {
      this.toggle_menu()
    })
    this._overflow_el.addEventListener("keydown", (event) => {
      if (event.key as Keys == "Enter") {
        this.toggle_menu()
      }
    })

    this._bar_el = div({class: [toolbars.bar]})
    this.shadow_el.append(this._bar_el, this.overflow_el)

    for (const ui_view of this.ui_element_views) {
      ui_view.render_to(this._bar_el)
    }

    const overflow_cls = this.horizontal ? toolbars.right : toolbars.above
    for (const ui_view of this.ui_element_menu_views) {
      ui_view.render()
      this._overflow_menu.items.push({custom: ui_view.el, class: overflow_cls})
    }
  }

  override _after_resize(): void {
    super._after_resize()

    const bar_bbox = this._bar_el.getBoundingClientRect()
    let any_overflows = false

    for (const view of this.ui_element_views) {
      const bbox = view.el.getBoundingClientRect()

      const overflows = (() => {
        if (this.horizontal) {
          return bbox.right > bar_bbox.right
        } else {
          return bbox.bottom > bar_bbox.bottom
        }
      })()
      any_overflows ||= overflows

      const menu_view = this._ui_element_menu_views.get(view.model)!
      menu_view.el.classList.toggle("bk-hidden", !overflows)
    }

    this.class_list.toggle(toolbars.overflows, any_overflows)
  }

  toggle_auto_scroll(force?: boolean): void {
    if (this.model.active_scroll != "auto") {
      return
    }

    for (const tool of this.model.tools) {
      if (tool.event_types.includes("scroll")) {
        tool.active = force ?? !tool.active
        break
      }
    }
  }
}

import {Struct, Ref, Nullable, List, Or} from "core/kinds"

const GestureToolLike = Or(Ref(GestureTool), Ref(ToolProxy<GestureTool>))
type GestureToolLike = GestureTool | ToolProxy<GestureTool>

const GestureEntry = Struct({
  tools: List(GestureToolLike),
  active: Nullable(GestureToolLike),
})
type GestureEntry = typeof GestureEntry["__type__"]

const GesturesMap = Struct({
  pan:       GestureEntry,
  scroll:    GestureEntry,
  pinch:     GestureEntry,
  rotate:    GestureEntry,
  move:      GestureEntry,
  tap:       GestureEntry,
  doubletap: GestureEntry,
  press:     GestureEntry,
  pressup:   GestureEntry,
  multi:     GestureEntry,
})

type GesturesMap = typeof GesturesMap["__type__"]
type GestureType = keyof GesturesMap

// XXX: add appropriate base classes to get rid of this
export type Inspection = Tool
export const Inspection = Tool

type ActiveGestureToolsProps = {
  active_drag: p.Property<GestureToolLike | "auto" | null>
  active_scroll: p.Property<GestureToolLike | "auto" | null>
  active_tap: p.Property<GestureToolLike | "auto" | null>
  active_multi: p.Property<GestureToolLike | "auto" | null>
}

export namespace Toolbar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    tools: p.Property<(Tool | ToolProxy<Tool>)[]>
    children: p.Property<(UIElement | null)[] | "auto">
    logo: p.Property<LogoVariant | null>
    autohide: p.Property<boolean>
    group: p.Property<boolean>
    group_types: p.Property<ToolName[]>

    // internal
    location: p.Property<Location>
    inner: p.Property<boolean>

    gestures: p.Property<GesturesMap>
    actions: p.Property<ToolLike<ActionTool>[]>
    inspectors: p.Property<ToolLike<InspectTool>[]>
    help: p.Property<ToolLike<HelpTool>[]>
    auxiliaries: p.Property<ToolLike<Tool>[]>
  } & ActiveGestureToolsProps & {
    active_inspect: p.Property<ToolLike<Inspection> | ToolLike<Inspection>[] | "auto" | null>
  }
}

export interface Toolbar extends Toolbar.Attrs {}

function create_gesture_map(): GesturesMap {
  return {
    pan:       {tools: [], active: null},
    scroll:    {tools: [], active: null},
    pinch:     {tools: [], active: null},
    rotate:    {tools: [], active: null},
    move:      {tools: [], active: null},
    tap:       {tools: [], active: null},
    doubletap: {tools: [], active: null},
    press:     {tools: [], active: null},
    pressup:   {tools: [], active: null},
    multi:     {tools: [], active: null},
  }
}

export class Toolbar extends UIElement {
  declare properties: Toolbar.Props
  declare __view_type__: ToolbarView

  constructor(attrs?: Partial<Toolbar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarView

    this.define<Toolbar.Props>(({Bool, List, Or, Ref, Nullable, Auto, Null}) => ({
      tools:          [ List(Or(Ref(Tool), Ref(ToolProxy))), [] ],
      children:       [ Or(List(Or(Ref(UIElement), Null)), Auto), "auto" ],
      logo:           [ Nullable(LogoVariant), "normal" ],
      autohide:       [ Bool, false ],
      group:          [ Bool, true ],
      group_types:    [ List(ToolName), ["hover"] ],
      active_drag:    [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_inspect: [ Nullable(Or(Ref(Inspection), List(Ref(Inspection)), Ref(ToolProxy), Auto)), "auto" ],
      active_scroll:  [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_tap:     [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_multi:   [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
    }))

    this.internal<Toolbar.Props>(({List, Bool, Ref, Or}) => {
      return {
        location:    [ Location, "right" ],
        inner:       [ Bool, false ],
        gestures:    [ GesturesMap, create_gesture_map ],
        actions:     [ List(Or(Ref(ActionTool), Ref(ToolProxy))), [] ],
        inspectors:  [ List(Or(Ref(InspectTool), Ref(ToolProxy))), [] ],
        auxiliaries: [ List(Or(Ref(Tool), Ref(ToolProxy))), [] ],
        help:        [ List(Or(Ref(HelpTool), Ref(ToolProxy))), [] ],
      }
    })
  }

  readonly active_changed: Signal0<this> = new Signal0(this, "active_changed")

  /**
   * Collect unique top-level tool like models.
   */
  get computed_tools(): ToolLike[] {
    const tools = new Set(this.tools)
    for (const child of this.children) {
      if (child instanceof ToolButton) {
        tools.add(child.tool)
      }
    }
    return [...tools]
  }

  /**
   * Collect all unique individual tool models.
   */
  get all_computed_tools(): Tool[] {
    const collected = new Set<Tool>()

    function visit(tools: ToolLike<Tool>[]) {
      for (const tool of tools) {
        if (tool instanceof ToolProxy) {
          visit(tool.tools)
        } else {
          collected.add(tool)
        }
      }
    }

    visit(this.computed_tools)
    return [...collected]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {tools, children, active_drag, active_inspect, active_scroll, active_tap, active_multi} = this.properties
    this.on_change([tools, children, active_drag, active_inspect, active_scroll, active_tap, active_multi], () => {
      this._init_tools()
      this._activate_tools(true)
    })
  }

  override initialize(): void {
    super.initialize()
    this._init_tools()
    this._activate_tools(false)
  }

  protected _init_tools(): void {
    type AbstractConstructor<T, Args extends any[] = any[]> = abstract new (...args: Args) => T

    const visited = new Set<ToolLike<Tool>>()
    function isa<A extends Tool>(tool: ToolLike<Tool>, type: AbstractConstructor<A>): tool is ToolLike<A> {
      const is = tool.underlying instanceof type
      if (is) {
        visited.add(tool)
      }
      return is
    }

    const tools = this.computed_tools

    const new_inspectors = this.tools.filter(t => isa(t, InspectTool))
    this.inspectors = new_inspectors

    const new_help = this.tools.filter(t => isa(t, HelpTool))
    this.help = new_help

    const new_actions = this.tools.filter(t => isa(t, ActionTool))
    this.actions = new_actions

    const new_gestures = create_gesture_map()
    for (const tool of tools) {
      if (isa(tool, GestureTool)) {
        new_gestures[tool.event_role].tools.push(tool)
      }
    }

    for (const et of typed_keys(new_gestures)) {
      const gesture = this.gestures[et]
      gesture.tools = sort_by(new_gestures[et].tools, (tool) => tool.default_order)

      if (gesture.active != null && every(gesture.tools, (tool) => tool.id != gesture.active?.id)) {
        gesture.active = null
      }
    }

    const new_auxiliaries = tools.filter((tool) => !visited.has(tool))
    this.auxiliaries = new_auxiliaries
  }

  protected _activate_tools(emit: boolean): void {
    if (this.active_inspect == "auto") {
      // do nothing as all tools are active be default
    } else if (this.active_inspect == null) {
      for (const inspector of this.inspectors) {
        inspector.active = false
      }
    } else if (isArray(this.active_inspect)) {
      const active_inspect = intersection(this.active_inspect, this.inspectors)
      if (active_inspect.length != this.active_inspect.length) {
        this.active_inspect = active_inspect
      }
      for (const inspector of this.inspectors) {
        if (!includes(this.active_inspect, inspector)) {
          inspector.active = false
        }
      }
    } else {
      let found = false
      for (const inspector of this.inspectors) {
        if (inspector != this.active_inspect) {
          inspector.active = false
        } else {
          found = true
        }
      }
      if (!found) {
        this.active_inspect = null
      }
    }

    const _activate_gesture = (tool: ToolLike<GestureTool>) => {
      if (tool.active) {
        // tool was activated by a proxy, but we need to finish configuration manually
        this._active_change(tool)
      } else {
        tool.active = true
      }
    }

    // Connecting signals has to be done before changing the active state of the tools.
    for (const gesture of values(this.gestures)) {
      for (const tool of gesture.tools) {
        // XXX: connect once
        this.connect(tool.properties.active.change, () => {
          this._active_change(tool)
          if (emit) {
            this.active_changed.emit()
          }
        })
      }
    }

    function _get_active_attr(et: GestureType): keyof ActiveGestureToolsProps | null {
      switch (et) {
        case "tap":    return "active_tap"
        case "pan":    return "active_drag"
        case "pinch":
        case "scroll": return "active_scroll"
        case "multi":  return "active_multi"
        default:       return null
      }
    }

    function _supports_auto(et: string, tool: ToolLike<Tool>): boolean {
      return et == "tap" || et == "pan" || tool.supports_auto()
    }

    const tools = this.computed_tools

    const is_active_gesture = (active_tool: ToolLike<GestureTool>): boolean => {
      return tools.includes(active_tool) || (
        active_tool instanceof Tool && tools.some((tool) => tool instanceof ToolProxy && tool.tools.includes(active_tool))
      )
    }

    const _resolve_gesture_activation = (gesture: GestureEntry, active_attr: keyof ActiveGestureToolsProps | null): void => {
      // some tools may already be initialized as active
      if (gesture.tools.every((tool) => !tool.active)) {
        return
      }

      // active attr takes precedence over any active initialization
      if (active_attr != null && this[active_attr] != null && this[active_attr] != "auto") {
        gesture.tools.forEach((tool) => {
          if (tool.tool_name != this[active_attr]) {
            tool.active = false
          }
        })
        return
      }

      for (const tool of gesture.tools) {
        if (!tool.active) {
          continue
        }

        if (gesture.active == null) {
          _activate_gesture(tool)
        } else if (gesture.active.id != tool.id && gesture.active.tool_name != tool.tool_name) {
          tool.active = false
        }
      }
    }

    for (const [event_role, gesture] of entries(this.gestures)) {
      const et = event_role as EventRole
      const active_attr = _get_active_attr(et)
      _resolve_gesture_activation(gesture, active_attr)
      if (active_attr != null) {
        const active_tool = this[active_attr]
        if (active_tool == "auto") {
          if (gesture.tools.length != 0 && gesture.active == null) {
            const [tool] = gesture.tools
            if (_supports_auto(et, tool)) {
              _activate_gesture(tool)
            }
          }
        } else if (active_tool != null) {
          if (is_active_gesture(active_tool)) {
            _activate_gesture(active_tool)
          } else {
            this[active_attr] = null
          }
        } else {
          this.gestures[et].active = null
          for (const tool of this.gestures[et].tools) {
            tool.active = false
          }
        }
      }
    }

    if (emit) {
      this.active_changed.emit()
    }
  }

  _active_change(tool: ToolLike<GestureTool>): void {
    const {event_types} = tool

    for (const et of event_types) {
      if (tool.active) {
        const currently_active_tool = this.gestures[et].active
        if (currently_active_tool != null && tool != currently_active_tool) {
          currently_active_tool.active = false
        }
        this.gestures[et].active = tool
      } else {
        this.gestures[et].active = null
      }
    }
  }

  to_menu(): Menu {
    const groups = [
      ...values(this.gestures).map((gesture) => gesture.tools),
      this.actions,
      this.inspectors,
      this.auxiliaries,
    ]

    const entries = groups
      .filter((group) => group.length != 0)
      .map((group) => group.map((tool) => tool.menu_item()))

    const items = [...join(entries, () => new DividerItem())]
    return new Menu({items})
  }
}
