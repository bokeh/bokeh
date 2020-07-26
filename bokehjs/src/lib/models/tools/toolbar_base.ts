import {logger} from "core/logging"
import {empty, div, a} from "core/dom"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"
import {DOMView} from "core/dom_view"
import {Logo, Location} from "core/enums"
import {EventType} from "core/ui_events"
import {some, every} from "core/util/array"
import {values} from "core/util/object"
import {isString} from "core/util/types"
import {Model} from "model"
import {Tool} from "./tool"
import {ButtonTool, ButtonToolButtonView} from "./button_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {ToolProxy} from "./tool_proxy"
import {InspectTool} from "./inspectors/inspect_tool"

import {bk_toolbar, bk_toolbar_hidden, bk_button_bar} from "styles/toolbar"
import {bk_logo, bk_logo_small, bk_grey} from "styles/logo"
import {bk_side} from "styles/mixins"

import toolbar_css from "styles/toolbar.css"
import logo_css from "styles/logo.css"

export namespace ToolbarViewModel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    _visible: p.Property<boolean | null>
    autohide: p.Property<boolean>
  }
}

export interface ToolbarViewModel extends ToolbarViewModel.Attrs { }

export class ToolbarViewModel extends Model {
  properties: ToolbarViewModel.Props

  constructor(attrs?: Partial<ToolbarViewModel.Attrs>) {
    super(attrs)
  }

  static init_ToolbarViewModel(): void {
    this.define<ToolbarViewModel.Props>({
      _visible: [ p.Any,     null  ],
      autohide: [ p.Boolean, false ],
    })
  }

  get visible(): boolean {
    return (!this.autohide) ? true : (this._visible == null) ? false : this._visible
  }
}

export class ToolbarBaseView extends DOMView {
  model: ToolbarBase

  protected _tool_button_views: Map<ButtonTool, ButtonToolButtonView>
  protected _toolbar_view_model: ToolbarViewModel

  initialize(): void {
    super.initialize()
    this._tool_button_views = new Map()
    this._toolbar_view_model = new ToolbarViewModel({autohide: this.model.autohide})
  }

  async lazy_initialize(): Promise<void> {
    await this._build_tool_button_views()
  }

  connect_signals(): void {
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

  styles(): string[] {
    return [...super.styles(), toolbar_css, logo_css]
  }

  remove(): void {
    remove_views(this._tool_button_views)
    super.remove()
  }

  protected async _build_tool_button_views(): Promise<void> {
    const tools: ButtonTool[] = (this.model._proxied_tools != null ? this.model._proxied_tools : this.model.tools) as any // XXX
    await build_views(this._tool_button_views as any, tools, {parent: this}, (tool) => tool.button_view) // XXX: no ButtonToolButton model
  }

  set_visibility(visible: boolean): void {
    if (visible != this._toolbar_view_model._visible) {
      this._toolbar_view_model._visible = visible
    }
  }

  protected _on_visible_change(): void {
    const visible = this._toolbar_view_model.visible
    const hidden_class = bk_toolbar_hidden
    if (this.el.classList.contains(hidden_class) && visible) {
      this.el.classList.remove(hidden_class)
    } else if (!visible) {
      this.el.classList.add(hidden_class)
    }
  }

  render(): void {
    empty(this.el)
    this.el.classList.add(bk_toolbar)
    this.el.classList.add(bk_side(this.model.toolbar_location))
    this._toolbar_view_model.autohide = this.model.autohide
    this._on_visible_change()

    if (this.model.logo != null) {
      const gray = this.model.logo === "grey" ? bk_grey : null
      const logo = a({href: "https://bokeh.org/", target: "_blank", class: [bk_logo, bk_logo_small, gray]})
      this.el.appendChild(logo)
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

    for (const bar of bars) {
      if (bar.length !== 0) {
        const el = div({class: bk_button_bar}, bar)
        this.el.appendChild(el)
      }
    }
  }

  update_layout(): void {}

  update_position(): void {}

  after_layout(): void {
    this._has_finished = true
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
    logo: p.Property<Logo>
    gestures: p.Property<GesturesMap>
    actions: p.Property<ActionTool[]>
    inspectors: p.Property<InspectTool[]>
    help: p.Property<HelpTool[]>
    toolbar_location: p.Property<Location>
    autohide: p.Property<boolean>
  }
}

export interface ToolbarBase extends ToolbarBase.Attrs {}

function createGestureMap(): GesturesMap {
  return {
    pan:       { tools: [], active: null },
    scroll:    { tools: [], active: null },
    pinch:     { tools: [], active: null },
    tap:       { tools: [], active: null },
    doubletap: { tools: [], active: null },
    press:     { tools: [], active: null },
    pressup:   { tools: [], active: null },
    rotate:    { tools: [], active: null },
    move:      { tools: [], active: null },
    multi:     { tools: [], active: null },
  }
}

export class ToolbarBase extends Model {
  properties: ToolbarBase.Props

  constructor(attrs?: Partial<ToolbarBase.Attrs>) {
    super(attrs)
  }

  static init_ToolbarBase(): void {
    this.prototype.default_view = ToolbarBaseView

    this.define<ToolbarBase.Props>({
      tools:      [ p.Array,   []       ],
      logo:       [ p.Logo,    'normal' ], // TODO (bev)
      autohide:   [ p.Boolean, false    ],
    })

    this.internal({
      gestures:         [ p.Any,      createGestureMap ],
      actions:          [ p.Array,    []      ],
      inspectors:       [ p.Array,    []      ],
      help:             [ p.Array,    []      ],
      toolbar_location: [ p.Location, 'right' ],
    })
  }

  _proxied_tools?: (Tool | ToolProxy)[]

  initialize(): void {
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
    const new_gestures = createGestureMap()
    for (const tool of this.tools) {
      if (tool instanceof GestureTool && tool.event_type) {
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
