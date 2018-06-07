import * as p from "core/properties"
import {logger} from "core/logging"
import {isString, isArray} from "core/util/types"
import {any, sortBy, includes} from "core/util/array"

import {Tool} from "./tool"
import {ActionTool} from "./actions/action_tool"
import {HelpTool} from "./actions/help_tool"
import {GestureTool} from "./gestures/gesture_tool"
import {InspectTool} from "./inspectors/inspect_tool"

import {ToolbarBase, ToolbarBaseView, GestureType} from "./toolbar_base"

// XXX: add appropriate base classes to get rid of this
export type Drag = Tool
export type Inspection = Tool
export type Scroll = Tool
export type Tap = Tool

export namespace Toolbar {
  export interface Attrs extends ToolbarBase.Attrs {
    active_drag: Drag | "auto"
    active_inspect: Inspection | Inspection[] | "auto"
    active_scroll: Scroll | "auto"
    active_tap: Tap | "auto"
    active_multi: GestureTool
  }

  export interface Props extends ToolbarBase.Props {}
}

export interface Toolbar extends Toolbar.Attrs {}

export class Toolbar extends ToolbarBase {

  properties: Toolbar.Props

  constructor(attrs?: Partial<Toolbar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Toolbar'
    this.prototype.default_view = ToolbarBaseView

    this.define({
      active_drag:     [ p.Any, 'auto' ],
      active_inspect:  [ p.Any, 'auto' ],
      active_scroll:   [ p.Any, 'auto' ],
      active_tap:      [ p.Any, 'auto' ],
      active_multi:    [ p.Any, null   ],
    })
  }

  initialize(): void {
    super.initialize()
    this._init_tools()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.tools.change, () => this._init_tools())
  }

  protected _init_tools(): void {
    for (const tool of this.tools) {
      if (tool instanceof InspectTool) {
        if (!any(this.inspectors, (t) => t.id == tool.id)) {
          this.inspectors = this.inspectors.concat([tool])
        }
      } else if (tool instanceof HelpTool) {
        if (!any(this.help, (t) => t.id == tool.id)) {
          this.help = this.help.concat([tool])
        }
      } else if (tool instanceof ActionTool) {
        if (!any(this.actions, (t) => t.id == tool.id)) {
          this.actions = this.actions.concat([tool])
        }
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

          this.connect(tool.properties.active.change, this._active_change.bind(this, tool))
        }
      }
    }

    if (this.active_inspect == 'auto') {
      // do nothing as all tools are active be default
    } else if (this.active_inspect instanceof InspectTool) {
      for (const inspector of this.inspectors) {
        if (inspector != this.active_inspect)
          inspector.active = false
      }
    } else if (isArray(this.active_inspect)) {
      for (const inspector of this.inspectors) {
        if (!includes(this.active_inspect, inspector))
          inspector.active = false
      }
    } else if (this.active_inspect == null) {
      for (const inspector of this.inspectors)
        inspector.active = false
    }

    const _activate_gesture = (tool: Tool) => {
      if (tool.active) {
        // tool was activated by a proxy, but we need to finish configuration manually
        this._active_change(tool)
      } else
        tool.active = true
    }

    for (const et in this.gestures) {
      const gesture = this.gestures[et as GestureType]

      if (gesture.tools.length == 0)
        continue

      gesture.tools = sortBy(gesture.tools, (tool) => tool.default_order)

      if (et == 'tap') {
        if (this.active_tap == null)
          continue

        if (this.active_tap == 'auto')
          _activate_gesture(gesture.tools[0])
        else
          _activate_gesture(this.active_tap)
      }

      if (et == 'pan') {
        if (this.active_drag == null)
          continue

        if (this.active_drag == 'auto')
          _activate_gesture(gesture.tools[0])
        else
          _activate_gesture(this.active_drag)
      }

      if (et == 'pinch' || et == 'scroll') {
        if (this.active_scroll == null || this.active_scroll == 'auto')
          continue
        _activate_gesture(this.active_scroll)
      }

      if (this.active_multi != null)
        _activate_gesture(this.active_multi)
    }
  }
}
Toolbar.initClass()
