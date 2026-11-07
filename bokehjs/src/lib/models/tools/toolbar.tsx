import {logger} from "core/logging"
import type {StyleSheetLike, Keys} from "core/dom"
import type {ViewStorage, ChildView, ViewOf} from "core/build_views"
import {build_views} from "core/build_views"
import type * as p from "core/properties"
import type {VNode} from "core/vdom"
import {UIComponent, ViewSlot, cls} from "core/vdom"
import {UIElement, UIElementView} from "../ui/ui_element"
import {Logo, Location, ToolName} from "core/enums"
import {every, sort_by, includes, intersection, clear} from "core/util/array"
import {join, enumerate} from "core/util/iterator"
import {typed_keys, values} from "core/util/object"
import {isArray} from "core/util/types"
import {assert} from "core/util/assert"
import {Tool} from "./tool"
import type {ToolLike} from "./tool_proxy"
import {ToolProxy} from "./tool_proxy"
import {ToolGroup} from "./tool_group"
import {ToolButton, ToolButtonView} from "./tool_button"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {Menu, DividerItem} from "../ui/menus"
import type {MenuItem} from "../ui/menus"
import {collapse_dividers} from "../ui/menus/divider_item"
import type {Model} from "../../model"
import type {At, MenuItemLike_} from "core/util/menus"
import {ContextMenu} from "core/util/menus"
import {Signal0} from "core/signaling"
import {version} from "version"

import toolbars_css, * as toolbars from "styles/toolbar.css"
import logos_css, * as logos from "styles/logo.css"
import icons_css from "styles/icons.css"

import {signal, computed} from "@preact/signals"
import {useLayoutEffect} from "preact/hooks"

type RefFn<T> = (el: T | null) => void

/**
 * An entry of the toolbar, either a tool button or a divider between groups of
 * tool buttons. Each entry has two views, one rendered in the bar and the other
 * in the overflow menu.
 */
type Entry = ToolButton | DividerItem

function is_divider(entry: Entry): entry is DividerItem {
  return entry instanceof DividerItem
}

type ToolbarItem = {
  /** An element rendered in the bar, measured and clipped when it doesn't fit. */
  bar_el: HTMLElement
  /** Its counterpart in the overflow menu, shown only when `bar_el` doesn't fit. */
  menu_el: HTMLElement
}

export class ToolbarView extends UIElementView {
  declare model: Toolbar
  declare readonly signals: p.SignalsOf<Toolbar.Props>
  declare readonly values: Toolbar.Attrs

  protected readonly _bar_views: ViewStorage<Entry> = new Map()
  protected readonly _menu_views: ViewStorage<Entry> = new Map()

  /** All entries, including dividers and buttons of hidden tools. */
  protected readonly _entries = signal<Entry[]>([])

  /** Entries shown in the bar (or in the overflow menu), as of the last render. */
  protected _shown_entries: Entry[] = []

  get tool_buttons(): ToolButton[] {
    return this._entries.value.filter((entry) => entry instanceof ToolButton)
  }
  get tool_button_views(): ViewOf<ToolButton>[] {
    return this.tool_buttons.map((tb) => this._bar_views.get(tb)).filter((view) => view instanceof ToolButtonView)
  }
  get tool_button_menu_views(): ViewOf<ToolButton>[] {
    return this.tool_buttons.map((tb) => this._menu_views.get(tb)).filter((view) => view instanceof ToolButtonView)
  }

  /**
   * Whether the pointer is over the toolbar's target (e.g. a plot), which
   * determines visibility of auto-hidden toolbars.
   */
  protected readonly _hover = signal<boolean | null>(null)

  protected readonly _visible = computed(() => {
    const {visible, autohide} = this.values
    return !visible ? false : (!autohide || (this._hover.value ?? false))
  })
  get visible(): boolean {
    return this._visible.value
  }

  set_visibility(visible: boolean): void {
    this._hover.value = visible
  }

  /**
   * Whether any items don't fit in the bar. This is determined by measuring the
   * DOM, see `_update_overflow()`.
   */
  protected readonly _overflows = signal(false)

  protected _bar_el: HTMLElement | null = null
  protected _overflow_el: HTMLElement | null = null

  get overflow_el(): HTMLElement {
    assert(this._overflow_el != null, "toolbar wasn't rendered")
    return this._overflow_el
  }

  /**
   * Items of the overflow menu. This array is shared by all instances of the menu.
   */
  protected readonly _menu_items: MenuItemLike_[] = []
  protected _overflow_menu: ContextMenu | null = null

  /**
   * The overflow menu. It's (re)created on demand, because its orientation depends
   * on the toolbar's location and `overflow_orientation`, which may change.
   */
  get overflow_menu(): ContextMenu {
    const {location, horizontal, overflow_orientation} = this.model
    // A parallel menu continues the toolbar, so it preserves the order of items.
    const reversed = overflow_orientation == "perpendicular" && (location == "left" || location == "above")
    const orientation = (() => {
      switch (overflow_orientation) {
        case "parallel":      return horizontal ? "horizontal" : "vertical"
        case "perpendicular": return horizontal ? "vertical" : "horizontal"
      }
    })()

    const menu = this._overflow_menu
    if (menu != null && menu.orientation == orientation && menu.reversed == reversed) {
      return menu
    }

    menu?.hide()
    return this._overflow_menu = new ContextMenu(this._menu_items, {
      target: this.el,
      orientation,
      reversed,
      prevent_hide: (event) => {
        return this._overflow_el != null && event.composedPath().includes(this._overflow_el)
      },
    })
  }

  override _children_views(): ChildView[] {
    return [...super._children_views(), ...this._bar_views.values(), ...this._menu_views.values()]
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const child_view of [...this._bar_views.values(), ...this._menu_views.values()]) {
      if (!child_view.has_finished()) {
        return false
      }
    }

    return true
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_tool_button_views()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {buttons, tools, group, group_types} = this.model.properties
    this.on_change([buttons, tools, group, group_types], async () => {
      await this._build_tool_button_views()
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), toolbars_css, logos_css, icons_css]
  }

  override remove(): void {
    this._overflow_menu?.hide()
    this._destroy_our_models()
    super.remove()
  }

  // Manually keep track of view constructed models (tool proxies and dividers), because models
  // don't have any sensible life cycle management (at least from views' perspective).
  private readonly _our_models: Model[] = []

  private _destroy_our_models(): void {
    for (const model of this._our_models) {
      model.destroy()
    }
    clear(this._our_models)
  }

  private _divider(): DividerItem {
    // Not syncable, because it's an implementation detail of the view.
    const divider = DividerItem.create({syncable: false})
    this._our_models.push(divider)
    return divider
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
        const proxy = ToolGroup.create({tools: group})
        this._our_models.push(proxy)
        return proxy
      } else {
        return group[0]
      }
    })
  }

  protected async _build_tool_button_views(): Promise<void> {
    this._destroy_our_models()

    const entries = (() => {
      const {buttons} = this.model
      if (buttons == "auto") {
        const tool_bars: ToolLike<Tool>[][] = [
          ...values(this.model.gestures).map((gesture) => gesture.tools),
          this.model.actions,
          this.model.inspectors,
          this.model.auxiliaries,
        ]

        const {group} = this.model
        // Dividers that don't separate anything are removed when rendering.
        return tool_bars.flatMap((bar) => {
          const grouped = group ? this._group_tools(bar) : bar
          return [this._divider(), ...grouped.map((tool) => tool.tool_button())]
        })
      } else {
        return buttons.map((button) => button ?? this._divider())
      }
    })()

    await build_views(this._bar_views, entries, {parent: this})
    await build_views(this._menu_views, entries, {parent: this})

    // Set after views were built, so that the component can render them.
    this._entries.value = entries
  }

  protected _menu_at(overflow_el: HTMLElement): At {
    if (this.model.overflow_orientation == "parallel") {
      // A parallel menu is attached from the back, i.e. its end is aligned with the end of the
      // overflow button, so that it extends along the toolbar instead of past its end.
      const {left, right, top, bottom} = overflow_el.getBoundingClientRect()
      switch (this.model.location) {
        case "right": return {right: left, bottom}
        case "left":  return {left: right, bottom}
        case "above": return {right, top: bottom}
        case "below": return {right, bottom: top}
      }
    }

    switch (this.model.location) {
      case "right": return {left_of:  overflow_el}
      case "left":  return {right_of: overflow_el}
      case "above": return {below: overflow_el}
      case "below": return {above: overflow_el}
    }
  }

  /**
   * Notifies the toolbar that the DOM of a tool button was updated. Tool buttons
   * are vDOM components, which update asynchronously, so this may happen after
   * the toolbar already measured its contents.
   */
  button_updated(button_view: ToolButtonView): void {
    if (this._bar_el?.contains(button_view.el) ?? false) {
      this._update_overflow()
    }
  }

  /**
   * Notifies the toolbar that a tool button was activated (e.g. tapped). If it's
   * a button from the overflow menu, then the menu is closed, the same way it
   * would be when activating a regular menu item.
   */
  button_tapped(button_view: ToolButtonView): void {
    if (this._menu_views.get(button_view.model) === button_view) {
      this._overflow_menu?.hide()
    }
  }

  toggle_menu(): void {
    if (this._overflow_el != null) {
      this.overflow_menu.toggle(this._menu_at(this._overflow_el))
    }
  }

  private readonly _bar_ref: RefFn<HTMLElement> = (el) => {
    this._bar_el = el
  }

  private readonly _overflow_ref: RefFn<HTMLElement> = (el) => {
    this._overflow_el = el
  }

  private readonly _on_overflow_keydown = (event: KeyboardEvent) => {
    if ((event.key as Keys) == "Enter") {
      this.toggle_menu()
    }
  }

  override component(): VNode {
    const {location, inner, logo} = this.values

    useLayoutEffect(() => {
      this._update_overflow()
    })

    // Track visibility of tools, so that the toolbar re-renders when it changes.
    const entries = this._entries.value
    const shown = collapse_dividers(entries.filter((entry) => is_divider(entry) || entry.tool.visible), is_divider)
    this._shown_entries = shown
    const is_shown = new Set(shown)

    const slot = (entry: Entry, views: ViewStorage<Entry>, prefix: string) => {
      const view = views.get(entry)
      return view != null ? <ViewSlot key={`${prefix}-${entry.id}`} view={view}/> : null
    }

    const bar_els = shown.map((entry) => slot(entry, this._bar_views, "bar"))

    // Entries are vDOM components, which have to be rendered into an attached node.
    // This holds entries that aren't shown (e.g. buttons of hidden tools) and entries
    // of the overflow menu, the later until the menu is shown.
    const held_els = [
      ...entries.filter((entry) => !is_shown.has(entry)).map((entry) => slot(entry, this._bar_views, "bar")),
      ...entries.map((entry) => slot(entry, this._menu_views, "menu")),
    ]

    const logo_el = (() => {
      if (logo == null) {
        return null
      } else {
        const gray = logo === "grey" ? logos.grey : null
        return <a href="https://bokeh.org/" target="_blank" class={cls(logos.logo, logos.logo_small, gray)} title={`Bokeh ${version}`}/>
      }
    })()

    const classes = cls(
      toolbars[location],
      inner ? toolbars.inner : null,
      !this.visible ? toolbars.hidden : null,
      this._overflows.value ? toolbars.overflows : null,
    )

    return (
      <UIComponent parent={this.resolved_props} class={classes}>
        {logo_el}
        <div class={toolbars.bar} ref={this._bar_ref}>{bar_els}</div>
        <div class={toolbars.overflow} tabIndex={0} ref={this._overflow_ref} onClick={() => this.toggle_menu()} onKeyDown={this._on_overflow_keydown}>
          <div class={toolbars.icon}/>
        </div>
        <div style={{display: "none"}}>{held_els}</div>
      </UIComponent>
    )
  }

  /**
   * Pairs of elements, one rendered in the toolbar's bar and the other in the
   * overflow menu, for the entries of the last render.
   */
  protected get _items(): ToolbarItem[] {
    const items: ToolbarItem[] = []
    for (const entry of this._shown_entries) {
      const bar_view = this._bar_views.get(entry)
      const menu_view = this._menu_views.get(entry)
      if (bar_view != null && menu_view != null) {
        items.push({bar_el: bar_view.el, menu_el: menu_view.el})
      }
    }
    return items
  }

  override _after_render(): void {
    super._after_render()
    this._update_overflow()
  }

  override update_bbox(): boolean {
    // Don't rely on `_after_resize()`, because the bbox may have been already
    // updated by a parent (e.g. `GridPlotView`), before the resize observer.
    const changed = super.update_bbox()
    if (changed) {
      this._update_overflow()
    }
    return changed
  }

  /**
   * Determine which items don't fit in the bar and show them (and only them)
   * in the overflow menu. Clipping of the bar itself is done purely with CSS.
   *
   * This has to measure the DOM synchronously, so it manipulates classes and
   * styles directly. Classes of the toolbar are also maintained by its component,
   * so the outcome is stored in `_overflows`, so that re-renders preserve it.
   * Items' elements are clipped with inline styles, which aren't managed by
   * vDOM (neither the toolbar's nor tool buttons').
   */
  protected _update_overflow(): void {
    const {_bar_el} = this
    if (_bar_el == null) {
      return
    }

    const {horizontal} = this.model
    const items = this._items

    // Clipped items aren't displayed, so reset them before measuring.
    this.el.classList.remove(toolbars.overflows)
    for (const {bar_el} of items) {
      bar_el.style.display = ""
    }

    const measure = (): boolean[] => {
      const bar_bbox = _bar_el.getBoundingClientRect()
      return items.map(({bar_el}) => {
        const bbox = bar_el.getBoundingClientRect()
        return horizontal ? bbox.right > bar_bbox.right : bbox.bottom > bar_bbox.bottom
      })
    }

    let overflows = measure()
    let any_overflows = overflows.some((overflow) => overflow)

    if (any_overflows) {
      // The overflow button takes space from the bar, so measure again with the button shown.
      this.el.classList.add(toolbars.measuring)
      overflows = measure()
      any_overflows = overflows.some((overflow) => overflow)
      this.el.classList.remove(toolbars.measuring)
    }

    this.el.classList.toggle(toolbars.overflows, any_overflows)
    this._overflows.value = any_overflows

    clear(this._menu_items)
    const overflow_cls = horizontal ? toolbars.right : toolbars.above

    for (const [{bar_el, menu_el}, i] of enumerate(items)) {
      const overflow = overflows[i]
      bar_el.style.display = overflow ? "none" : ""
      menu_el.style.display = overflow ? "" : "none"
      this._menu_items.push({custom: menu_el, class: overflow_cls})
    }

    // This also replaces the menu if its orientation changed.
    const {overflow_menu} = this
    if (overflow_menu.is_open && this._overflow_el != null) {
      if (any_overflows) {
        overflow_menu.show(this._menu_at(this._overflow_el))
      } else {
        overflow_menu.hide()
      }
    }

    for (const tb_view of this.tool_button_views) {
      tb_view.update_bbox()
    }
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

import {Struct, Ref, Nullable, List, Or, Enum} from "core/kinds"

/**
 * Orientation of the overflow menu relative to the orientation of the toolbar.
 */
export const OverflowOrientation = Enum("perpendicular", "parallel")
export type OverflowOrientation = typeof OverflowOrientation["__type__"]

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
    logo: p.Property<Logo | null>
    autohide: p.Property<boolean>
    group: p.Property<boolean>
    group_types: p.Property<ToolName[]>

    // internal
    buttons: p.Property<(ToolButton | null)[] | "auto">
    location: p.Property<Location>
    inner: p.Property<boolean>
    overflow_orientation: p.Property<OverflowOrientation>

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

  static {
    this.prototype.default_view = ToolbarView

    this.define<Toolbar.Props>(({Bool, List, Or, Ref, Nullable, Auto}) => ({
      tools:          [ List(Or(Ref(Tool), Ref(ToolProxy))), [] ],
      logo:           [ Nullable(Logo), "normal" ],
      autohide:       [ Bool, false ],
      group:          [ Bool, true ],
      group_types:    [ List(ToolName), ["hover"] ],
      active_drag:    [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_inspect: [ Nullable(Or(Ref(Inspection), List(Ref(Inspection)), Ref(ToolProxy), Auto)), "auto" ],
      active_scroll:  [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_tap:     [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
      active_multi:   [ Nullable(Or(GestureToolLike, Auto)), "auto" ],
    }))

    this.internal<Toolbar.Props>(({List, Bool, Ref, Or, Null, Auto}) => {
      return {
        buttons:    [ Or(List(Or(Ref(ToolButton), Null)), Auto), "auto" ],
        location:   [ Location, "right" ],
        inner:      [ Bool, false ],
        overflow_orientation: [ OverflowOrientation, "perpendicular" ],
        gestures:   [ GesturesMap, create_gesture_map ],
        actions:    [ List(Or(Ref(ActionTool), Ref(ToolProxy))), [] ],
        inspectors: [ List(Or(Ref(InspectTool), Ref(ToolProxy))), [] ],
        auxiliaries: [ List(Or(Ref(Tool), Ref(ToolProxy))), [] ],
        help:       [ List(Or(Ref(HelpTool), Ref(ToolProxy))), [] ],
      }
    })
  }

  readonly active_changed: Signal0<this> = new Signal0(this, "active_changed")

  get horizontal(): boolean {
    return this.location == "above" || this.location == "below"
  }

  get vertical(): boolean {
    return this.location == "left" || this.location == "right"
  }

  override connect_signals(): void {
    super.connect_signals()

    const {tools, active_drag, active_inspect, active_scroll, active_tap, active_multi} = this.properties
    this.on_change([tools, active_drag, active_inspect, active_scroll, active_tap, active_multi], () => {
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
    type ClassLike<T> = Function & {prototype: T}

    const visited = new Set<ToolLike<Tool>>()

    function isa<A extends Tool>(tool: ToolLike<Tool>, type: ClassLike<A>): tool is ToolLike<A> {
      const is = tool.underlying instanceof type
      if (is) {
        visited.add(tool)
      }
      return is
    }

    const new_inspectors = this.tools.filter(t => isa(t, InspectTool))
    this.inspectors = new_inspectors

    const new_help = this.tools.filter(t => isa(t, HelpTool))
    this.help = new_help

    const new_actions = this.tools.filter(t => isa(t, ActionTool))
    this.actions = new_actions

    const new_gestures = create_gesture_map()
    for (const tool of this.tools) {
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

    const new_auxiliaries = this.tools.filter((tool) => !visited.has(tool))
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

    const is_active_gesture = (active_tool: ToolLike<GestureTool>): boolean => {
      return this.tools.includes(active_tool) || (active_tool instanceof Tool && this.tools.some((tool) => tool instanceof ToolProxy && tool.tools.includes(active_tool)))
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

    for (const et of typed_keys(this.gestures)) {
      const gesture = this.gestures[et]
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
          logger.debug(`Toolbar: deactivating tool: ${currently_active_tool} for event type '${et}'`)
          currently_active_tool.active = false
        }
        this.gestures[et].active = tool
        logger.debug(`Toolbar: activating tool: ${tool} for event type '${et}'`)
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

    const items = [...join<MenuItem | DividerItem>(entries, () => DividerItem.create())]
    return Menu.create({items})
  }
}
