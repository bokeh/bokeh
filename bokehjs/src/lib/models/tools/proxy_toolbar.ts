import {ToolbarBase, GestureType} from "./toolbar_base"
import {Tool} from "./tool"
import {ButtonTool} from "./button_tool"
import {ActionTool} from "./actions/action_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ToolProxy} from "./tool_proxy"

import * as p from "core/properties"
import {includes, sort_by} from "core/util/array"
import {keys, values, entries} from "core/util/object"

export namespace ProxyToolbar {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToolbarBase.Props
}

export interface ProxyToolbar extends ProxyToolbar.Attrs {}

export class ProxyToolbar extends ToolbarBase {
  override properties: ProxyToolbar.Props

  constructor(attrs?: Partial<ProxyToolbar.Attrs>) {
    super(attrs)
  }

  override _proxied_tools: (Tool | ToolProxy)[]

  override initialize(): void {
    super.initialize()
    this._merge_tools()
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

    for (const [event_type, gesture] of entries(this.gestures)) {
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

    for (const event_type of keys(gestures)) {
      const gesture = this.gestures[event_type as GestureType]
      gesture.tools = []

      for (const tool_type of keys(gestures[event_type])) {
        const tools = gestures[event_type][tool_type]

        if (tools.length > 0) {
          if (event_type == "multi") {
            for (const tool of tools) {
              const proxy = make_proxy([tool])
              gesture.tools.push(proxy as any)
              this.connect(proxy.properties.active.change, () => this._active_change(proxy as any))
            }
          } else {
            const proxy = make_proxy(tools)
            gesture.tools.push(proxy as any)
            this.connect(proxy.properties.active.change, () => this._active_change(proxy as any))
          }
        }
      }
    }

    this.actions = []
    for (const [tool_type, tools] of entries(actions)) {
      if (tool_type == "CustomAction") {
        for (const tool of tools)
          this.actions.push(make_proxy([tool]) as any)
      } else if (tools.length > 0) {
        this.actions.push(make_proxy(tools) as any) // XXX
      }
    }

    this.inspectors = []
    for (const tools of values(inspectors)) {
      if (tools.length > 0)
        this.inspectors.push(make_proxy(tools, true) as any) // XXX
    }

    for (const [et, gesture] of entries(this.gestures)) {
      if (gesture.tools.length == 0)
        continue

      gesture.tools = sort_by(gesture.tools, (tool) => tool.default_order)

      if (!(et == "pinch" || et == "scroll" || et == "multi"))
        gesture.tools[0].active = true
    }
  }
}
