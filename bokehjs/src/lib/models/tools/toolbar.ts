import {logger} from "core/logging"
import type {StyleSheetLike} from "core/dom"
import {div, a} from "core/dom"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import type * as p from "core/properties"
import {UIElement, UIElementView} from "../ui/ui_element"
import {Logo, Location} from "core/enums"
import type {EventType} from "core/ui_events"
import {every, sort_by, includes, intersection, split, clear} from "core/util/array"
import {join} from "core/util/iterator"
import {typed_keys, values, entries} from "core/util/object"
import {isArray} from "core/util/types"
import type {EventRole} from "./tool"
import {Tool} from "./tool"
import type {ToolLike} from "./tool_proxy"
import {ToolProxy} from "./tool_proxy"
import {ToolButton} from "./tool_button"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {ContextMenu} from "core/util/menus"

import toolbars_css, * as toolbars from "styles/toolbar.css"
import logos_css, * as logos from "styles/logo.css"
import icons_css from "styles/icons.css"

export class ToolbarView extends UIElementView {
  declare model: Toolbar

  protected readonly _tool_button_views: ViewStorage<ToolButton> = new Map()
  protected _tool_buttons: ToolButton[][]
  protected _items: HTMLElement[] = []

  get tool_buttons(): ToolButton[] {
    return this._tool_buttons.flat()
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

  override *children(): IterViews {
    yield* super.children()
    yield* this._tool_button_views.values()
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const child_view of this._tool_button_views.values()) {
      if (!child_view.has_finished())
        return false
    }

    return true
  }

  override initialize(): void {
    super.initialize()

    const {location} = this.model
    const reversed = location == "left" || location == "above"
    const orientation = this.model.horizontal ? "vertical" : "horizontal"
    this._overflow_menu = new ContextMenu([], {
      target: this.root.el,
      orientation,
      reversed,
      prevent_hide: (event) => {
        return event.composedPath().includes(this._overflow_el)
      },
    })
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_tool_button_views()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {buttons, tools} = this.model.properties
    this.on_change([buttons, tools], async () => {
      await this._build_tool_button_views()
      this.render()
    })

    this.connect(this.model.properties.autohide.change, () => {
      this._on_visible_change()
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), toolbars_css, logos_css, icons_css]
  }

  override remove(): void {
    remove_views(this._tool_button_views)
    super.remove()
  }

  protected async _build_tool_button_views(): Promise<void> {
    this._tool_buttons = (() => {
      const {buttons} = this.model
      if (buttons == "auto") {
        const groups = [
          ...values(this.model.gestures).map((gesture) => gesture.tools.filter((tool) => tool.visible)),
          this.model.actions.filter((tool) => tool.visible),
          this.model.inspectors.filter((tool) => tool.visible && tool.toggleable),
          this.model.auxiliaries.filter((tool) => tool.visible),
        ]
        return groups.map((group) => group.map((tool) => tool.tool_button()))
      } else {
        return split(buttons, null)
      }
    })()

    await build_views(this._tool_button_views, this._tool_buttons.flat(), {parent: this})
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

  override _after_resize(): void {
    super._after_resize()
    this._after_render()
  }

  override render(): void {
    super.render()

    this.el.classList.add(toolbars[this.model.location])
    this.el.classList.toggle(toolbars.inner, this.model.inner)
    this._on_visible_change()

    const {horizontal} = this.model

    this._overflow_el = div({class: toolbars.tool_overflow, tabIndex: 0}, horizontal ? "⋮" : "⋯")
    const toggle_menu = () => {
      const at = (() => {
        switch (this.model.location) {
          case "right": return {left_of:  this._overflow_el}
          case "left":  return {right_of: this._overflow_el}
          case "above": return {below: this._overflow_el}
          case "below": return {above: this._overflow_el}
        }
      })()
      this._overflow_menu.toggle(at)
    }
    this._overflow_el.addEventListener("click", () => {
      toggle_menu()
    })
    this._overflow_el.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        toggle_menu()
      }
    })

    this._items = []

    if (this.model.logo != null) {
      const gray = this.model.logo === "grey" ? logos.grey : null
      const logo_el = a({href: "https://bokeh.org/", target: "_blank", class: [logos.logo, logos.logo_small, gray]})
      this._items.push(logo_el)
      this.shadow_el.appendChild(logo_el)
    }

    for (const [, button_view] of this._tool_button_views) {
      button_view.render()
      button_view.after_render()
    }

    const bars = this._tool_buttons.map((group) => group.map((button) => this._tool_button_views.get(button)!.el))
    const non_empty = bars.filter((bar) => bar.length != 0)

    const divider = () => div({class: toolbars.divider})

    for (const el of join<HTMLElement>(non_empty, divider)) {
      this._items.push(el)
      this.shadow_el.appendChild(el)
    }
  }

  override _after_render(): void {
    super._after_render()

    clear(this._overflow_menu.items)

    if (this.shadow_el.contains(this._overflow_el)) {
      this.shadow_el.removeChild(this._overflow_el)
    }

    for (const el of this._items) {
      if (!this.shadow_el.contains(el)) {
        this.shadow_el.append(el)
      }
    }

    const {horizontal} = this.model
    const overflow_size = 15
    const {bbox} = this
    const overflow_cls = horizontal ? toolbars.right : toolbars.above
    let size = 0
    let overflowed = false

    for (const el of this._items) {
      if (overflowed) {
        this.shadow_el.removeChild(el)
        this._overflow_menu.items.push({custom: el, class: overflow_cls})
      } else {
        const {width, height} = el.getBoundingClientRect()
        size += horizontal ? width : height
        overflowed = horizontal ? size > bbox.width - overflow_size : size > bbox.height - overflow_size
        if (overflowed) {
          this.shadow_el.removeChild(el)
          this.shadow_el.appendChild(this._overflow_el)
          this._overflow_menu.items.push({custom: el, class: overflow_cls})
        }
      }
    }
  }
}

export type GesturesMap = {
  pan:       {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  scroll:    {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  pinch:     {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  tap:       {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  doubletap: {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  press:     {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  pressup:   {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  rotate:    {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  move:      {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
  multi:     {tools: ToolLike<GestureTool>[], active: ToolLike<GestureTool> | null}
}

export type GestureType = keyof GesturesMap

// XXX: add appropriate base classes to get rid of this
export type Drag = Tool
export const Drag = Tool
export type Inspection = Tool
export const Inspection = Tool
export type Scroll = Tool
export const Scroll = Tool
export type Tap = Tool
export const Tap = Tool

type ActiveGestureToolsProps = {
  active_drag: p.Property<ToolLike<Drag> | "auto" | null>
  active_scroll: p.Property<ToolLike<Scroll> | "auto" | null>
  active_tap: p.Property<ToolLike<Tap> | "auto" | null>
  active_multi: p.Property<ToolLike<GestureTool> | "auto" | null>
}

export namespace Toolbar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    tools: p.Property<(Tool | ToolProxy<Tool>)[]>
    logo: p.Property<Logo | null>
    autohide: p.Property<boolean>

    // internal
    buttons: p.Property<(ToolButton | null)[] | "auto">
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
    tap:       {tools: [], active: null},
    doubletap: {tools: [], active: null},
    press:     {tools: [], active: null},
    pressup:   {tools: [], active: null},
    rotate:    {tools: [], active: null},
    move:      {tools: [], active: null},
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

    this.define<Toolbar.Props>(({Boolean, Array, Or, Ref, Nullable, Auto}) => ({
      tools:          [ Array(Or(Ref(Tool), Ref(ToolProxy))), [] ],
      logo:           [ Nullable(Logo), "normal" ],
      autohide:       [ Boolean, false ],
      active_drag:    [ Nullable(Or(Ref(Drag), Auto)), "auto" ],
      active_inspect: [ Nullable(Or(Ref(Inspection), Array(Ref(Inspection)), Auto)), "auto" ],
      active_scroll:  [ Nullable(Or(Ref(Scroll), Auto)), "auto" ],
      active_tap:     [ Nullable(Or(Ref(Tap), Auto)), "auto" ],
      active_multi:   [ Nullable(Or(Ref(GestureTool), Auto)), "auto" ],
    }))

    this.internal<Toolbar.Props>(({Array, Boolean, Ref, Or, Struct, Nullable, Null, Auto}) => {
      const GestureEntry = Struct({
        tools: Array(Ref(GestureTool)),
        active: Nullable(Ref(GestureTool)),
      })
      const GestureMap = Struct({
        pan:       GestureEntry,
        scroll:    GestureEntry,
        pinch:     GestureEntry,
        tap:       GestureEntry,
        doubletap: GestureEntry,
        press:     GestureEntry,
        pressup:   GestureEntry,
        rotate:    GestureEntry,
        move:      GestureEntry,
        multi:     GestureEntry,
      })
      return {
        buttons:    [ Or(Array(Or(Ref(ToolButton), Null)), Auto), "auto" ],
        location:   [ Location, "right" ],
        inner:      [ Boolean, false ],
        gestures:   [ GestureMap, create_gesture_map ],
        actions:    [ Array(Or(Ref(ActionTool), Ref(ToolProxy))), [] ],
        inspectors: [ Array(Or(Ref(InspectTool), Ref(ToolProxy))), [] ],
        auxiliaries: [ Array(Or(Ref(Tool), Ref(ToolProxy))), [] ],
        help:       [ Array(Or(Ref(HelpTool), Ref(ToolProxy))), [] ],
      }
    })
  }

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
      this._activate_tools()
    })
  }

  override initialize(): void {
    super.initialize()
    this._init_tools()
    this._activate_tools()
  }

  protected _init_tools(): void {
    type AbstractConstructor<T, Args extends any[] = any[]> = abstract new (...args: Args) => T

    const visited = new Set<ToolLike<Tool>>()
    function isa<A extends Tool>(tool: ToolLike<Tool>, type: AbstractConstructor<A>): tool is ToolLike<A> {
      const is = (tool instanceof ToolProxy ? tool.underlying : tool) instanceof type
      if (is) {
        visited.add(tool)
      }
      return is
    }

    const new_inspectors = this.tools.filter(t => isa(t, InspectTool)) as ToolLike<InspectTool>[]
    this.inspectors = new_inspectors

    const new_help = this.tools.filter(t => isa(t, HelpTool)) as ToolLike<HelpTool>[]
    this.help = new_help

    const new_actions = this.tools.filter(t => isa(t, ActionTool)) as ToolLike<ActionTool>[]
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

  protected _activate_tools(): void {
    if (this.active_inspect == "auto") {
      // do nothing as all tools are active be default
    } else if (this.active_inspect == null) {
      for (const inspector of this.inspectors)
        inspector.active = false
    } else if (isArray(this.active_inspect)) {
      const active_inspect = intersection(this.active_inspect, this.inspectors)
      if (active_inspect.length != this.active_inspect.length) {
        this.active_inspect = active_inspect
      }
      for (const inspector of this.inspectors) {
        if (!includes(this.active_inspect, inspector))
          inspector.active = false
      }
    } else {
      let found = false
      for (const inspector of this.inspectors) {
        if (inspector != this.active_inspect)
          inspector.active = false
        else
          found = true
      }
      if (!found) {
        this.active_inspect = null
      }
    }

    const _activate_gesture = (tool: ToolLike<GestureTool>) => {
      if (tool.active) {
        // tool was activated by a proxy, but we need to finish configuration manually
        this._active_change(tool)
      } else
        tool.active = true
    }

    // Connecting signals has to be done before changing the active state of the tools.
    for (const gesture of values(this.gestures)) {
      for (const tool of gesture.tools) {
        // XXX: connect once
        this.connect(tool.properties.active.change, () => this._active_change(tool))
      }
    }

    function _get_active_attr(et: EventType | "multi"): keyof ActiveGestureToolsProps | null {
      switch (et) {
        case "tap":    return "active_tap"
        case "pan":    return "active_drag"
        case "pinch":
        case "scroll": return "active_scroll"
        case "multi":  return "active_multi"
        default:       return null
      }
    }

    function _supports_auto(et: string): boolean {
      return et == "tap" || et == "pan"
    }

    for (const [event_role, gesture] of entries(this.gestures)) {
      const et = event_role as EventRole
      const active_attr = _get_active_attr(et)
      if (active_attr != null) {
        const active_tool = this[active_attr]
        if (active_tool == "auto") {
          if (gesture.tools.length != 0 && _supports_auto(et)) {
            _activate_gesture(gesture.tools[0])
          }
        } else if (active_tool != null) {
          // TODO: allow to activate a proxy of tools with any child?
          if (includes(this.tools, active_tool)) {
            _activate_gesture(active_tool as ToolLike<GestureTool>) // XXX: remove this cast
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
      } else
        this.gestures[et].active = null
    }
  }
}
