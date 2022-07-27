import {logger} from "core/logging"
import {div, a, Keys, StyleSheetLike} from "core/dom"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"
import {DOMComponentView} from "core/dom_view"
import {Logo, Location} from "core/enums"
import {EventType} from "core/ui_events"
import {every, sort_by, includes, intersection} from "core/util/array"
import {join} from "core/util/iterator"
import {values, entries} from "core/util/object"
import {isString, isArray} from "core/util/types"
import {CanvasLayer} from "core/util/canvas"
import {BBox} from "core/util/bbox"
import {Model} from "model"
import {Tool} from "./tool"
import {ToolProxy, ToolLike} from "./tool_proxy"
import {ToolButtonView} from "./tool_button"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {ContextMenu} from "core/util/menus"

import toolbars_css, * as toolbars from "styles/toolbar.css"
import tools_css, * as tools from "styles/tool_button.css"
import logos_css, * as logos from "styles/logo.css"
import icons_css from "styles/icons.css"

export class ToolbarView extends DOMComponentView {
  override model: Toolbar
  override el: HTMLElement

  protected _tool_button_views: Map<ToolLike<Tool>, ToolButtonView>
  protected _overflow_menu: ContextMenu
  protected _overflow_el?: HTMLElement

  private _visible: boolean | null = null
  get visible(): boolean {
    return !this.model.autohide || (this._visible ?? false)
  }

  override initialize(): void {
    super.initialize()
    this._tool_button_views = new Map()

    const {toolbar_location} = this.model
    const reversed = toolbar_location == "left" || toolbar_location == "above"
    const orientation = this.model.horizontal ? "vertical" : "horizontal"
    this._overflow_menu = new ContextMenu([], {
      orientation,
      reversed,
      prevent_hide: (event) => {
        return this._overflow_el != null ? event.composedPath().includes(this._overflow_el) : false
      },
      extra_styles: [tools_css],
    })
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_tool_button_views()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tools.change, async () => {
      await this._build_tool_button_views()
      this.render()
    })
    this.connect(this.model.properties.autohide.change, () => this._on_visible_change())
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), toolbars_css, tools_css, logos_css, icons_css]
  }

  override remove(): void {
    remove_views(this._tool_button_views)
    super.remove()
  }

  protected async _build_tool_button_views(): Promise<void> {
    await build_views(this._tool_button_views as any, this.model.tools, {parent: this as any}, (tool) => tool.button_view) // XXX: no ButtonToolButton model
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

  override render(): void {
    this.empty()

    this.el.className = ""
    this.el.classList.add(toolbars[this.model.toolbar_location])
    this._on_visible_change()

    const {horizontal} = this.model
    let size = 0

    if (this.model.logo != null) {
      const gray = this.model.logo === "grey" ? logos.grey : null
      const logo_el = a({href: "https://bokeh.org/", target: "_blank", class: [logos.logo, logos.logo_small, gray]})
      this.shadow_el.appendChild(logo_el)
      const {width, height} = logo_el.getBoundingClientRect()
      size += horizontal ? width : height
    }

    for (const [, button_view] of this._tool_button_views) {
      button_view.render()
    }

    const bars: HTMLElement[][] = []

    const el = (tool: ToolLike<Tool>) => {
      return this._tool_button_views.get(tool)!.el
    }

    const {gestures} = this.model
    for (const gesture of values(gestures)) {
      bars.push(gesture.tools.map(el))
    }

    bars.push(this.model.actions.map(el))
    bars.push(this.model.inspectors.filter((tool) => tool.toggleable).map(el))

    const non_empty = bars.filter((bar) => bar.length != 0)
    const divider = () => div({class: tools.divider})

    const {bbox} = this.layout

    let overflowed = false
    const overflow_size = 15
    this.root.children_el.appendChild(this._overflow_menu.el)
    const overflow_el = div({class: tools.tool_overflow, tabIndex: 0}, horizontal ? "⋮" : "⋯")
    this._overflow_el = overflow_el
    const toggle_menu = () => {
      const at = (() => {
        switch (this.model.toolbar_location) {
          case "right": return {left_of:  overflow_el}
          case "left":  return {right_of: overflow_el}
          case "above": return {below: overflow_el}
          case "below": return {above: overflow_el}
        }
      })()
      this._overflow_menu.toggle(at)
    }
    this._overflow_el.addEventListener("click", () => {
      toggle_menu()
    })
    this._overflow_el.addEventListener("keydown", (event) => {
      if (event.keyCode == Keys.Enter) {
        toggle_menu()
      }
    })

    for (const el of join<HTMLElement>(non_empty, divider)) {
      if (overflowed) {
        this._overflow_menu.items.push({content: el, class: horizontal ? toolbars.right : toolbars.above})
      } else {
        this.shadow_el.appendChild(el)
        const {width, height} = el.getBoundingClientRect()
        size += horizontal ? width : height
        overflowed = horizontal ? size > bbox.width - overflow_size : size > bbox.height - overflow_size
        if (overflowed) {
          this.shadow_el.removeChild(el)
          this.shadow_el.appendChild(this._overflow_el)

          const {items} = this._overflow_menu
          items.splice(0, items.length)
          items.push({content: el})
        }
      }
    }
  }

  layout = {bbox: new BBox()}

  update_layout(): void {}

  update_position(): void {}

  after_layout(): void {
    this._has_finished = true
  }

  export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "auto" || type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    const {width, height} = this.layout.bbox
    canvas.resize(width, height)
    return canvas
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

  export type Props = Model.Props & {
    tools: p.Property<(Tool | ToolProxy<Tool>)[]>
    logo: p.Property<Logo | null>
    autohide: p.Property<boolean>
    toolbar_location: p.Property<Location>

    gestures: p.Property<GesturesMap>
    actions: p.Property<ToolLike<ActionTool>[]>
    inspectors: p.Property<ToolLike<InspectTool>[]>
    help: p.Property<ToolLike<HelpTool>[]>

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

export class Toolbar extends Model {
  override properties: Toolbar.Props
  override __view_type__: ToolbarView

  constructor(attrs?: Partial<Toolbar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarView

    this.define<Toolbar.Props>(({Any, Boolean, Array, Or, Ref, Nullable/*, Null, Auto*/}) => ({
      tools:          [ Array(Or(Ref(Tool), Ref(ToolProxy))), [] ],
      logo:           [ Nullable(Logo), "normal" ],
      autohide:       [ Boolean, false ],
      active_drag:    [ Any /*Or(Ref(Drag), Auto, Null)*/, "auto" ],
      active_inspect: [ Any /*Or(Ref(Inspection), Array(Ref(Inspection)), Auto, Null)*/, "auto" ],
      active_scroll:  [ Any /*Or(Ref(Scroll), Auto, Null)*/, "auto" ],
      active_tap:     [ Any /*Or(Ref(Tap), Auto, Null)*/, "auto" ],
      active_multi:   [ Any /*Or(Ref(GestureTool), Auto, Null)*/, "auto" ],
    }))

    this.internal<Toolbar.Props>(({Any, Array, Ref, Or/*, Struct, Nullable*/}) => {
      /*
      const GestureEntry = Struct({
        tools: Array(Ref(GestureTool)),
        active: Nullable(Ref(Tool)),
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
      */
      return {
        gestures:         [ Any, /*GestureMap,*/ create_gesture_map ],
        actions:          [ Array(Or(Ref(ActionTool), Ref(ToolProxy))), [] ],
        inspectors:       [ Array(Or(Ref(InspectTool), Ref(ToolProxy))), [] ],
        help:             [ Array(Or(Ref(HelpTool), Ref(ToolProxy))), [] ],
        toolbar_location: [ Location, "right" ],
      }
    })
  }

  get horizontal(): boolean {
    return this.toolbar_location == "above" || this.toolbar_location == "below"
  }

  get vertical(): boolean {
    return this.toolbar_location == "left" || this.toolbar_location == "right"
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

    function isa<A extends Tool>(tool: unknown, type: AbstractConstructor<A>): tool is ToolLike<A> {
      return (tool instanceof ToolProxy ? tool.underlying : tool) instanceof type
    }

    const new_inspectors = this.tools.filter(t => isa(t, InspectTool)) as ToolLike<InspectTool>[]
    this.inspectors = new_inspectors

    const new_help = this.tools.filter(t => isa(t, HelpTool)) as ToolLike<HelpTool>[]
    this.help = new_help

    const new_actions = this.tools.filter(t => isa(t, ActionTool)) as ToolLike<ActionTool>[]
    this.actions = new_actions

    const check_event_type = (et: EventType, tool: ToolLike<Tool>) => {
      if (!(et in this.gestures)) {
        logger.warn(`Toolbar: unknown event type '${et}' for tool: ${tool}`)
      }
    }

    const new_gestures = create_gesture_map()
    for (const tool of this.tools) {
      if (isa(tool, GestureTool)) {
        if (isString(tool.event_type)) {
          new_gestures[tool.event_type].tools.push(tool)
          check_event_type(tool.event_type, tool)
        } else {
          new_gestures.multi.tools.push(tool)
          for (const et of tool.event_type) {
            check_event_type(et, tool)
          }
        }
      }
    }
    for (const et of Object.keys(new_gestures) as GestureType[]) {
      const gm = this.gestures[et]
      gm.tools = new_gestures[et].tools

      if (gm.active && every(gm.tools, t => t.id != gm.active?.id)) {
        gm.active = null
      }
    }
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
      gesture.tools = sort_by(gesture.tools, (tool) => tool.default_order)
      for (const tool of gesture.tools) {
        // XXX: connect once
        this.connect(tool.properties.active.change, () => this._active_change(tool))
      }
    }

    function _get_active_attr(et: EventType | "multi"): keyof ActiveGestureToolsProps | null {
      switch (et) {
        case "tap": return "active_tap"
        case "pan": return "active_drag"
        case "pinch":
        case "scroll": return "active_scroll"
        case "multi": return "active_multi"
      }
      return null
    }

    function _supports_auto(et: string): boolean {
      return et == "tap" || et == "pan"
    }

    for (const [event_type, gesture] of entries(this.gestures)) {
      const et = event_type as EventType | "multi"
      const active_attr = _get_active_attr(et)
      if (active_attr) {
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
    const {event_type} = tool
    const event_types = isString(event_type) ? [event_type] : event_type

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
