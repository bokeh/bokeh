import * as p from "core/properties"
import {Location} from "core/enums"
import {includes, sort_by} from "core/util/array"
import {keys, values, entries} from "core/util/object"

import {Tool} from "./tool"
import {ButtonTool} from "./button_tool"
import {ActionTool} from "./actions/action_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"
import {ToolbarBase, GestureType} from "./toolbar_base"
import {Toolbar} from "./toolbar"
import {ToolProxy} from "./tool_proxy"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {ContentBox} from "core/layout"

export namespace ProxyToolbar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToolbarBase.Props & {
    toolbars: p.Property<Toolbar[]>
  }
}

export interface ProxyToolbar extends ProxyToolbar.Attrs {}

export class ProxyToolbar extends ToolbarBase {
  properties: ProxyToolbar.Props

  constructor(attrs?: Partial<ProxyToolbar.Attrs>) {
    super(attrs)
  }

  static init_ProxyToolbar(): void {
    this.define<ProxyToolbar.Props>({
      toolbars: [ p.Array, [] ],
    })
  }

  _proxied_tools: (Tool | ToolProxy)[]

  initialize(): void {
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
          if (event_type == 'multi') {
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
      if (tool_type == 'CustomAction') {
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

      if (!(et == 'pinch' || et == 'scroll' || et == 'multi'))
        gesture.tools[0].active = true
    }
  }
}

export class ToolbarBoxView extends LayoutDOMView {
  model: ToolbarBox

  initialize(): void {
    this.model.toolbar.toolbar_location = this.model.toolbar_location
    super.initialize()
  }

  get child_models(): LayoutDOM[] {
    return [this.model.toolbar as any] // XXX
  }

  _update_layout(): void {
    this.layout = new ContentBox(this.child_views[0].el)

    const {toolbar} = this.model

    if (toolbar.horizontal) {
      this.layout.set_sizing({
        width_policy: "fit", min_width: 100, height_policy: "fixed",
      })
    } else {
      this.layout.set_sizing({
        width_policy: "fixed", height_policy: "fit", min_height: 100,
      })
    }
  }
}

export namespace ToolbarBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<ToolbarBase>
    toolbar_location: p.Property<Location>
  }
}

export interface ToolbarBox extends ToolbarBox.Attrs {}

export class ToolbarBox extends LayoutDOM {
  properties: ToolbarBox.Props

  constructor(attrs?: Partial<ToolbarBox.Attrs>) {
    super(attrs)
  }

  static init_ToolbarBox(): void {
    this.prototype.default_view = ToolbarBoxView

    this.define<ToolbarBox.Props>({
      toolbar:          [ p.Instance          ],
      toolbar_location: [ p.Location, "right" ],
    })
  }
}
