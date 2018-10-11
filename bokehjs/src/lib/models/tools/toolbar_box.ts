import * as p from "core/properties"
import {Location, SizingMode} from "core/enums"
import {empty} from "core/dom"
import {logger} from "core/logging"
import {isString} from "core/util/types"
import {any, sortBy, includes} from "core/util/array"

import {Tool} from "./tool"
import {ButtonTool} from "./button_tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ToolbarBase, ToolbarBaseView, GestureType} from "./toolbar_base"
import {ToolProxy} from "./tool_proxy"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {build_views, remove_views} from "core/build_views"

export namespace ProxyToolbar {
  export interface Attrs extends ToolbarBase.Attrs {}

  export interface Props extends ToolbarBase.Props {}
}

export interface ProxyToolbar extends ProxyToolbar.Attrs {}

export class ProxyToolbar extends ToolbarBase {

  properties: ProxyToolbar.Props

  constructor(attrs?: Partial<ProxyToolbar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ProxyToolbar"
  }

  _proxied_tools: (Tool | ToolProxy)[]

  initialize(): void {
    super.initialize()
    this._init_tools()
    this._merge_tools()
  }

  protected _init_tools(): void {
    for (const tool of this.tools) {
      if (tool instanceof InspectTool) {
        if (!any(this.inspectors, (t) => t.id == tool.id))
          this.inspectors = this.inspectors.concat([tool])
      } else if (tool instanceof HelpTool) {
        if (!any(this.help, (t) => t.id == tool.id))
          this.help = this.help.concat([tool])
      } else if (tool instanceof ActionTool) {
        if (!any(this.actions, (t) => t.id == tool.id))
          this.actions = this.actions.concat([tool])
      } else if (tool instanceof GestureTool) {
        let event_types: GestureType[]
        let multi: boolean
        if (isString(tool.event_type)) {
          event_types = [tool.event_type]
          multi = false
        } else {
          event_types = tool.event_type || []
          multi = true
        }

        for (let et of event_types) {
          if (!(et in this.gestures)) {
            logger.warn(`Toolbar: unknown event type '${et}' for tool: ${tool.type} (${tool.id})`)
            continue
          }

          if (multi)
            et = "multi"

          if (!any(this.gestures[et].tools, (t) => t.id == tool.id))
            this.gestures[et].tools = this.gestures[et].tools.concat([tool])
        }
      }
    }
  }

  protected _merge_tools(): void {
    // Go through all the tools on the toolbar and replace them with
    // a proxy e.g. PanTool, BoxSelectTool, etc.
    this._proxied_tools = []

    const inspectors: {[key: string]: InspectTool[]} = {}
    const actions: {[key: string]: ActionTool[]} = {}
    const gestures: {[key: string]: {[key: string]: GestureTool[]}} = {}

    const new_help_tools = []
    const new_help_urls = []
    for (const helptool of this.help) {
      if (!includes(new_help_urls, helptool.redirect)) {
        new_help_tools.push(helptool)
        new_help_urls.push(helptool.redirect)
      }
    }
    this._proxied_tools.push(...new_help_tools)
    this.help = new_help_tools

    for (const event_type in this.gestures) {
      const gesture = this.gestures[event_type as GestureType]
      if (!(event_type in gestures)) {
        gestures[event_type] = {}
      }
      for (const tool of gesture.tools) {
        if (!(tool.type in gestures[event_type])) {
          gestures[event_type][tool.type] = []
        }
        gestures[event_type][tool.type].push(tool)
      }
    }

    for (const tool of this.inspectors) {
      if (!(tool.type in inspectors)) {
        inspectors[tool.type] = []
      }
      inspectors[tool.type].push(tool)
    }

    for (const tool of this.actions) {
      if (!(tool.type in actions)) {
        actions[tool.type] = []
      }
      actions[tool.type].push(tool)
    }

    // Add a proxy for each of the groups of tools.
    const make_proxy = (tools: ButtonTool[], active: boolean = false) => {
      const proxy = new ToolProxy({tools, active})
      this._proxied_tools.push(proxy)
      return proxy
    }

    for (const event_type in gestures) {
      const gesture = this.gestures[event_type as GestureType]
      gesture.tools = []

      for (const tool_type in gestures[event_type]) {
        const tools = gestures[event_type][tool_type]

        if (tools.length > 0) {
          if (event_type == 'multi') {
            for (const tool of tools) {
              const proxy = make_proxy([tool])
              gesture.tools.push(proxy as any)
              this.connect(proxy.properties.active.change, this._active_change.bind(this, proxy))
            }
          } else {
            const proxy = make_proxy(tools)
            gesture.tools.push(proxy as any)
            this.connect(proxy.properties.active.change, this._active_change.bind(this, proxy))
          }
        }
      }
    }

    this.actions = []
    for (const tool_type in actions) {
      const tools = actions[tool_type]

      if (tool_type == 'CustomAction') {
        for (const tool of tools)
          this.actions.push(make_proxy([tool]) as any)
      } else if (tools.length > 0) {
        this.actions.push(make_proxy(tools) as any) // XXX
      }
    }

    this.inspectors = []
    for (const tool_type in inspectors) {
      const tools = inspectors[tool_type]

      if (tools.length > 0)
        this.inspectors.push(make_proxy(tools, true) as any) // XXX
    }

    for (const et in this.gestures) {
      const gesture = this.gestures[et as GestureType]
      if (gesture.tools.length == 0)
        continue

      gesture.tools = sortBy(gesture.tools, (tool) => tool.default_order)

      if (!(et == 'pinch' || et == 'scroll' || et == 'multi'))
        gesture.tools[0].active = true
    }
  }
}
ProxyToolbar.initClass()

export class ToolbarBoxView extends LayoutDOMView {
  model: ToolbarBox

  protected _toolbar_views: {[key: string]: ToolbarBaseView}

  initialize(options: any): void {
    super.initialize(options)
    this.model.toolbar.toolbar_location = this.model.toolbar_location
    this._toolbar_views = {}
    build_views(this._toolbar_views, [this.model.toolbar], {parent: this})
  }

  remove(): void {
    remove_views(this._toolbar_views)
    super.remove()
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-box")
  }

  render(): void {
    super.render()

    const toolbar = this._toolbar_views[this.model.toolbar.id]
    toolbar.render()

    empty(this.el)
    this.el.appendChild(toolbar.el)
  }

  get_width(): number {
    return this.model.toolbar.vertical ? 30 : null as never
  }

  get_height(): number {
    return this.model.toolbar.horizontal ? 30 : null as never
  }
}

export namespace ToolbarBox {
  export interface Attrs extends LayoutDOM.Attrs {
    toolbar: ToolbarBase
    toolbar_location: Location
  }

  export interface Props extends LayoutDOM.Props {}
}

export interface ToolbarBox extends ToolbarBox.Attrs {}

export class ToolbarBox extends LayoutDOM {

  properties: ToolbarBox.Props

  constructor(attrs?: Partial<ToolbarBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ToolbarBox'
    this.prototype.default_view = ToolbarBoxView

    this.define({
      toolbar:          [ p.Instance          ],
      toolbar_location: [ p.Location, "right" ],
    })
  }

  // XXX: we are overriding LayoutDOM.sizing_mode here. That's a bad
  // hack, but currently every layoutable is allowed to have its
  // sizing mode configured, which is wrong. Another example of this
  // is PlotCanvas which only works with strech_both sizing mode.
  get sizing_mode(): SizingMode {
    switch (this.toolbar_location) {
      case "above":
      case "below": {
        return "scale_width"
      }
      case "left":
      case "right": {
        return "scale_height"
      }
    }
  }
}
ToolbarBox.initClass()
