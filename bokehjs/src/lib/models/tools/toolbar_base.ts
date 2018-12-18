import {logger} from "core/logging"
import {empty, div, a} from "core/dom"
import {build_views, remove_views} from "core/build_views"
import * as p from "core/properties"
import {DOMView} from "core/dom_view"
import {Logo, Location} from "core/enums"
import {EventType} from "core/ui_events"
import {isString} from "core/util/types"
import {Model} from "model"
import {Tool} from "./tool"
import {ButtonTool, ButtonToolButtonView} from "./button_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {ToolProxy} from "./tool_proxy"
import {InspectTool} from "./inspectors/inspect_tool"

export namespace ToolbarViewModel {
  export interface Attrs extends Model.Attrs {
    _visible: boolean
    autohide: boolean
  }

  export interface Props extends Model.Props {
    _visible: p.Property<boolean>
    autohide: p.Property<boolean>
  }
}

export interface ToolbarViewModel extends ToolbarViewModel.Attrs { }

export class ToolbarViewModel extends Model {
  properties: ToolbarViewModel.Props

  constructor(attrs?: Partial<ToolbarViewModel.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ToolbarBase'

    this.define({
      _visible: [p.Bool, null],
      autohide: [p.Bool, false],
    })
  }

  get visible(): boolean {
    return (!this.autohide) ? true: (this._visible == null) ? false: this._visible
  }
}
ToolbarViewModel.initClass()

export class ToolbarBaseView extends DOMView {
  model: ToolbarBase

  protected _tool_button_views: {[key: string]: ButtonToolButtonView}
  protected _toolbar_view_model: ToolbarViewModel

  initialize(options: any): void {
    super.initialize(options)
    this._tool_button_views = {}
    this._build_tool_button_views()
    this._toolbar_view_model = new ToolbarViewModel({autohide: this.model.autohide})
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.tools.change, () => this._build_tool_button_views())
    this.connect(this.model.properties.autohide.change, () => {
      this._toolbar_view_model.autohide = this.model.autohide
      this._on_visible_change()
    })
    this.connect(this._toolbar_view_model.properties._visible.change, () => this._on_visible_change())
  }

  remove(): void {
    remove_views(this._tool_button_views)
    super.remove()
  }

  protected _build_tool_button_views(): void {
    const tools: ButtonTool[] = (this.model._proxied_tools != null ? this.model._proxied_tools : this.model.tools) as any // XXX
    build_views(this._tool_button_views, tools, {parent: this}, (tool) => tool.button_view)
  }

  set_visibility(visible: boolean): void {
    if (visible != this._toolbar_view_model._visible) {
      this._toolbar_view_model._visible = visible
    }
  }

  protected _on_visible_change(): void {
    const visible = this._toolbar_view_model.visible
    const hidden_class = "bk-toolbar-hidden"
    if (this.el.classList.contains(hidden_class) && visible) {
      this.el.classList.remove(hidden_class)
    } else if (!visible) {
      this.el.classList.add(hidden_class)
    }
  }

  render(): void {
    empty(this.el)
    this.el.classList.add("bk-toolbar")
    this.el.classList.add(`bk-toolbar-${this.model.toolbar_location}`)
    this._toolbar_view_model.autohide = this.model.autohide
    this._on_visible_change()

    if (this.model.logo != null) {
      const cls = this.model.logo === "grey" ? "bk-grey" : null
      const logo = a({href: "https://bokeh.pydata.org/", target: "_blank", class: ["bk-logo", "bk-logo-small", cls]})
      this.el.appendChild(logo)
    }

    const bars: HTMLElement[][] = []

    const el = (tool: Tool) => {
      return this._tool_button_views[tool.id].el
    }

    const {gestures} = this.model
    for (const et in gestures) {
      bars.push(gestures[et as EventType].tools.map(el))
    }

    bars.push(this.model.actions.map(el))
    bars.push(this.model.inspectors.filter((tool) => tool.toggleable).map(el))
    bars.push(this.model.help.map(el))

    for (const bar of bars) {
      if (bar.length !== 0) {
        const el = div({class: 'bk-button-bar'}, bar)
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

export type GestureType = "pan" | "scroll" | "pinch" | "tap" | "doubletap" | "press" | "rotate" | "move" | "multi"

export namespace ToolbarBase {
  export interface Attrs extends Model.Attrs {
    tools: Tool[]
    logo: Logo
    gestures: {
      pan:       { tools: GestureTool[], active: Tool | null },
      scroll:    { tools: GestureTool[], active: Tool | null },
      pinch:     { tools: GestureTool[], active: Tool | null },
      tap:       { tools: GestureTool[], active: Tool | null },
      doubletap: { tools: GestureTool[], active: Tool | null },
      press:     { tools: GestureTool[], active: Tool | null },
      rotate:    { tools: GestureTool[], active: Tool | null },
      move:      { tools: GestureTool[], active: Tool | null },
      multi:     { tools: GestureTool[], active: Tool | null },
    },
    actions: ActionTool[]
    inspectors: InspectTool[]
    help: HelpTool[]
    toolbar_location: Location
    autohide: boolean
  }

  export interface Props extends Model.Props {
    tools: p.Property<Tool[]>
    autohide: p.Property<boolean>
  }
}

export interface ToolbarBase extends ToolbarBase.Attrs {}

export class ToolbarBase extends Model {
  properties: ToolbarBase.Props

  constructor(attrs?: Partial<ToolbarBase.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ToolbarBase'
    this.prototype.default_view = ToolbarBaseView

    this.define({
      tools:      [ p.Array,      []       ],
      logo:       [ p.String,     'normal' ], // TODO (bev)
      autohide:   [ p.Bool,       false    ],
    })

    this.internal({
      gestures: [ p.Any, () => ({
        pan:       { tools: [], active: null },
        scroll:    { tools: [], active: null },
        pinch:     { tools: [], active: null },
        tap:       { tools: [], active: null },
        doubletap: { tools: [], active: null },
        press:     { tools: [], active: null },
        rotate:    { tools: [], active: null },
        move:      { tools: [], active: null },
        multi:     { tools: [], active: null },
      })  ],
      actions:          [ p.Array,    []      ],
      inspectors:       [ p.Array,    []      ],
      help:             [ p.Array,    []      ],
      toolbar_location: [ p.Location, 'right' ],
    })
  }

  _proxied_tools?: (Tool | ToolProxy)[]

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
          logger.debug(`Toolbar: deactivating tool: ${currently_active_tool.type} (${currently_active_tool.id}) for event type '${et}'`)
          currently_active_tool.active = false
        }
        this.gestures[et].active = tool
        logger.debug(`Toolbar: activating tool: ${tool.type} (${tool.id}) for event type '${et}'`)
      } else
        this.gestures[et].active = null
    }
  }
}
ToolbarBase.initClass()
