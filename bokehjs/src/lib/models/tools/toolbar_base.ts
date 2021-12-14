import {logger} from "core/logging"
import {classes, div, a, Keys} from "core/dom"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"
import {DOMComponentView} from "core/dom_view"
import {Logo, Location} from "core/enums"
import {EventType} from "core/ui_events"
import {some, every} from "core/util/array"
import {join} from "core/util/iterator"
import {values} from "core/util/object"
import {isString} from "core/util/types"
import {CanvasLayer} from "core/util/canvas"
import {BBox} from "core/util/bbox"
import {Model} from "model"
import {Tool} from "./tool"
import {ButtonTool, ButtonToolButtonView} from "./button_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {ToolProxy} from "./tool_proxy"
import {InspectTool} from "./inspectors/inspect_tool"
import {ContextMenu} from "core/util/menus"

import toolbars_css, * as toolbars from "styles/toolbar.css"
import logos_css, * as logos from "styles/logo.css"
import icons_css from "styles/icons.css"

export namespace ToolbarViewModel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    autohide: p.Property<boolean>
    _visible: p.Property<boolean | null>
  }
}

export interface ToolbarViewModel extends ToolbarViewModel.Attrs { }

export class ToolbarViewModel extends Model {
  override properties: ToolbarViewModel.Props

  constructor(attrs?: Partial<ToolbarViewModel.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToolbarViewModel.Props>(({Boolean}) => ({
      autohide: [ Boolean, false ],
    }))

    this.internal<ToolbarViewModel.Props>(({Boolean, Nullable}) => ({
      _visible: [ Nullable(Boolean), null ],
    }))
  }

  get visible(): boolean {
    return !this.autohide || (this._visible ?? false)
  }
}

export class ToolbarBaseView extends DOMComponentView {
  override model: ToolbarBase
  override el: HTMLElement

  protected _tool_button_views: Map<ButtonTool, ButtonToolButtonView>
  protected _toolbar_view_model: ToolbarViewModel
  protected _overflow_menu: ContextMenu
  protected _overflow_el?: HTMLElement

  override initialize(): void {
    super.initialize()
    this._tool_button_views = new Map()
    this._toolbar_view_model = new ToolbarViewModel({autohide: this.model.autohide})

    const {toolbar_location} = this.model
    const reversed = toolbar_location == "left" || toolbar_location == "above"
    const orientation = this.model.horizontal ? "vertical" : "horizontal"
    this._overflow_menu = new ContextMenu([], {
      orientation,
      reversed,
      prevent_hide: (event) => {
        return this._overflow_el != null ? event.composedPath().includes(this._overflow_el) : false
      },
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
    this.connect(this.model.properties.autohide.change, () => {
      this._toolbar_view_model.autohide = this.model.autohide
      this._on_visible_change()
    })
    this.connect(this._toolbar_view_model.properties._visible.change, () => this._on_visible_change())
  }

  override styles(): string[] {
    return [...super.styles(), toolbars_css, logos_css, icons_css]
  }

  override remove(): void {
    remove_views(this._tool_button_views)
    super.remove()
  }

  protected async _build_tool_button_views(): Promise<void> {
    const tools: ButtonTool[] = (this.model._proxied_tools != null ? this.model._proxied_tools : this.model.tools) as any // XXX
    await build_views(this._tool_button_views as any, tools, {parent: this as any}, (tool) => tool.button_view) // XXX: no ButtonToolButton model
  }

  set_visibility(visible: boolean): void {
    if (visible != this._toolbar_view_model._visible) {
      this._toolbar_view_model._visible = visible
    }
  }

  protected _on_visible_change(): void {
    const {visible} = this._toolbar_view_model
    classes(this.el).toggle(toolbars.hidden, !visible)
  }

  override render(): void {
    this.empty()

    this.el.classList.add(toolbars[this.model.toolbar_location])
    this._toolbar_view_model.autohide = this.model.autohide
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

    const el = (tool: ButtonTool) => {
      return this._tool_button_views.get(tool)!.el
    }

    const {gestures} = this.model
    for (const gesture of values(gestures)) {
      bars.push(gesture.tools.map(el))
    }

    bars.push(this.model.actions.map(el))
    bars.push(this.model.inspectors.filter((tool) => tool.toggleable).map(el))

    const non_empty = bars.filter((bar) => bar.length != 0)
    const divider = () => div({class: toolbars.divider})

    const {bbox} = this.layout

    let overflowed = false
    const overflow_size = 15
    this.root.shadow_el.appendChild(this._overflow_menu.el)
    const overflow_el = div({class: toolbars.tool_overflow, tabIndex: 0}, horizontal ? "⋮" : "⋯")
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

  export(type: "png" | "svg", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "png" ? "canvas" : "svg"
    const canvas = new CanvasLayer(output_backend, hidpi)
    canvas.resize(0, 0)
    return canvas
  }
}

export type GesturesMap = {
  pan:       { tools: GestureTool[], active: Tool | null }
  scroll:    { tools: GestureTool[], active: Tool | null }
  pinch:     { tools: GestureTool[], active: Tool | null }
  tap:       { tools: GestureTool[], active: Tool | null }
  doubletap: { tools: GestureTool[], active: Tool | null }
  press:     { tools: GestureTool[], active: Tool | null }
  pressup:   { tools: GestureTool[], active: Tool | null }
  rotate:    { tools: GestureTool[], active: Tool | null }
  move:      { tools: GestureTool[], active: Tool | null }
  multi:     { tools: GestureTool[], active: Tool | null }
}

export type GestureType = keyof GesturesMap

export namespace ToolbarBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    tools: p.Property<Tool[]>
    logo: p.Property<Logo | null>
    gestures: p.Property<GesturesMap>
    actions: p.Property<ActionTool[]>
    inspectors: p.Property<InspectTool[]>
    help: p.Property<HelpTool[]>
    toolbar_location: p.Property<Location>
    autohide: p.Property<boolean>
  }
}

export interface ToolbarBase extends ToolbarBase.Attrs {}

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

export class ToolbarBase extends Model {
  override properties: ToolbarBase.Props

  constructor(attrs?: Partial<ToolbarBase.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarBaseView

    this.define<ToolbarBase.Props>(({Boolean, Array, Ref, Nullable}) => ({
      tools:    [ Array(Ref(Tool)), [] ],
      logo:     [ Nullable(Logo), "normal" ],
      autohide: [ Boolean, false ],
    }))

    this.internal<ToolbarBase.Props>(({Array, Struct, Ref, Nullable}) => {
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
      return {
        gestures:         [ GestureMap, create_gesture_map ],
        actions:          [ Array(Ref(ActionTool)), [] ],
        inspectors:       [ Array(Ref(InspectTool)), [] ],
        help:             [ Array(Ref(HelpTool)), [] ],
        toolbar_location: [ Location, "right" ],
      }
    })
  }

  _proxied_tools?: (Tool | ToolProxy)[]

  override initialize(): void {
    super.initialize()
    this._init_tools()
  }

  protected _init_tools(): void {
    // The only purpose of this function is to avoid unnecessary property churning.
    const tools_changed = function(old_tools: Tool[], new_tools: Tool[]) {
      if (old_tools.length != new_tools.length) {
        return true
      }
      const new_ids = new Set(new_tools.map(t => t.id))
      return some(old_tools, t=> !new_ids.has(t.id))
    }
    const new_inspectors = this.tools.filter(t => t instanceof InspectTool) as InspectTool[]
    if (tools_changed(this.inspectors, new_inspectors)) {
      this.inspectors = new_inspectors
    }
    const new_help = this.tools.filter(t => t instanceof HelpTool) as HelpTool[]
    if (tools_changed(this.help, new_help)) {
      this.help = new_help
    }
    const new_actions = this.tools.filter(t => t instanceof ActionTool) as ActionTool[]
    if (tools_changed(this.actions, new_actions)) {
      this.actions = new_actions
    }
    const check_event_type = (et: EventType, tool: Tool) => {
      if (!(et in this.gestures)) {
        logger.warn(`Toolbar: unknown event type '${et}' for tool: ${tool}`)
      }
    }
    const new_gestures = create_gesture_map()
    for (const tool of this.tools) {
      if (tool instanceof GestureTool && tool.event_type != null) {
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
      if (tools_changed(gm.tools, new_gestures[et].tools)) {
        gm.tools = new_gestures[et].tools
      }
      if (gm.active && every(gm.tools, t => t.id != gm.active!.id)) {
        gm.active = null
      }
    }
  }

  get horizontal(): boolean {
    return this.toolbar_location === "above" || this.toolbar_location === "below"
  }

  get vertical(): boolean {
    return this.toolbar_location === "left" || this.toolbar_location === "right"
  }

  _active_change(tool: Tool): void {
    const {event_type} = tool

    if (event_type == null)
      return

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
