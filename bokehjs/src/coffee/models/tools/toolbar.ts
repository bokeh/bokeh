/* XXX: partial */
import * as p from "core/properties";
import {any, sortBy, includes} from "core/util/array";
import {logger} from "core/logging";

import {Tool} from "./tool"
import {ActionTool} from "./actions/action_tool";
import {HelpTool} from "./actions/help_tool";
import {GestureTool} from "./gestures/gesture_tool";
import {InspectTool} from "./inspectors/inspect_tool";

import {ToolbarBase, ToolbarBaseView} from "./toolbar_base"

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
    this.prototype.type = 'Toolbar';
    this.prototype.default_view = ToolbarBaseView; // XXX

    this.define({
      active_drag:     [ p.Any, 'auto' ],
      active_inspect:  [ p.Any, 'auto' ],
      active_scroll:   [ p.Any, 'auto' ],
      active_tap:      [ p.Any, 'auto' ],
    });
  }

  initialize(): void {
    super.initialize();
    this._init_tools();
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.tools.change, () => this._init_tools())
  }

  _init_tools() {
    for (const tool of this.tools) {
      if (tool instanceof InspectTool) {
        if (!any(this.inspectors, t => t.id === tool.id)) {
          this.inspectors = this.inspectors.concat([tool]);
        }
      } else if (tool instanceof HelpTool) {
        if (!any(this.help, t => t.id === tool.id)) {
          this.help = this.help.concat([tool]);
        }
      } else if (tool instanceof ActionTool) {
        if (!any(this.actions, t => t.id === tool.id)) {
          this.actions = this.actions.concat([tool]);
        }
      } else if (tool instanceof GestureTool) {
        let event_types = tool.event_type;
        let multi = true;
        if (typeof event_types === 'string') {
          event_types = [event_types];
          multi = false;
        }

        for (let et of event_types) {
          if (!(et in this.gestures)) {
            logger.warn(`Toolbar: unknown event type '${et}' for tool: ${tool.type} (${tool.id})`);
            continue;
          }

          if (multi)
            et = "multi"

          if (!any(this.gestures[et].tools, t => t.id === tool.id))
            this.gestures[et].tools = this.gestures[et].tools.concat([tool]);

          this.connect(tool.properties.active.change, this._active_change.bind(this, tool));
        }
      }
    }

    if (this.active_inspect === 'auto') {
      // do nothing as all tools are active be default

    } else if (this.active_inspect instanceof InspectTool) {
      this.inspectors.map(inspector => { if (inspector !== this.active_inspect) { return inspector.active = false; } });
    } else if (this.active_inspect instanceof Array) {
      this.inspectors.map(inspector => { if (!includes(this.active_inspect, inspector)) { return inspector.active = false; } });
    } else if (this.active_inspect === null) {
      this.inspectors.map(inspector => inspector.active = false);
    }

    const _activate_gesture = tool => {
      if (tool.active) {
        // tool was activated by a proxy, but we need to finish configuration manually
        return this._active_change(tool);
      } else {
        return tool.active = true;
      }
    };

    for (const et in this.gestures) {
      const { tools } = this.gestures[et];
      if (tools.length === 0) {
        continue;
      }
      this.gestures[et].tools = sortBy(tools, tool => tool.default_order);

      if (et === 'tap') {
        if (this.active_tap === null) {
          continue;
        }
        if (this.active_tap === 'auto') {
          _activate_gesture(this.gestures[et].tools[0]);
        } else {
          _activate_gesture(this.active_tap);
        }
      }

      if (et === 'pan') {
        if (this.active_drag === null) {
          continue;
        }
        if (this.active_drag === 'auto') {
          _activate_gesture(this.gestures[et].tools[0]);
        } else {
          _activate_gesture(this.active_drag);
        }
      }

      if (et == 'pinch' || et == 'scroll') {
        if ((this.active_scroll === null) || (this.active_scroll === 'auto')) {
          continue;
        }
        _activate_gesture(this.active_scroll);
      }
    }

    return null;
  }
}
Toolbar.initClass();
