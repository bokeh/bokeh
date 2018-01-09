/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as p from "core/properties";
import {empty} from "core/dom";
import {any, sortBy, includes} from "core/util/array";

import {ActionTool} from "./actions/action_tool";
import {HelpTool} from "./actions/help_tool";
import {GestureTool} from "./gestures/gesture_tool";
import {InspectTool} from "./inspectors/inspect_tool";
import {ToolbarBase} from "./toolbar_base";
import {ToolProxy} from "./tool_proxy";

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom";
import {build_views, remove_views} from "core/build_views"
;

export class ProxyToolbar extends ToolbarBase {
  static initClass() {
    this.prototype.type = 'ProxyToolbar';
  }

  initialize(options) {
    super.initialize(options);
    this._init_tools();
    return this._merge_tools();
  }

  _init_tools() {
    for (var tool of Array.from(this.tools)) {
      if (tool instanceof InspectTool) {
        if (!any(this.inspectors, t => t.id === tool.id))
          this.inspectors = this.inspectors.concat([tool]);
      } else if (tool instanceof HelpTool) {
        if (!any(this.help, t => t.id === tool.id))
          this.help = this.help.concat([tool]);
      } else if (tool instanceof ActionTool) {
        if (!any(this.actions, t => t.id === tool.id))
          this.actions = this.actions.concat([tool]);
      } else if (tool instanceof GestureTool) {
        let event_types = tool.event_type
        let multi = true
        if (typeof event_types === "string") {
          event_types = [event_types]
          multi = false
        }

        for (let et of event_types) {
          if (!(et in this.gestures)) {
            logger.warn(`Toolbar: unknown event type '${et}' for tool: ${tool.type} (${tool.id})`)
            continue
          }

          if (multi)
            et = "multi"

          if (!any(this.gestures[et].tools, t => t.id === tool.id))
            this.gestures[et].tools = this.gestures[et].tools.concat([tool]);
        }
      }
    }
  }

  _merge_tools() {
    // Go through all the tools on the toolbar and replace them with
    // a proxy e.g. PanTool, BoxSelectTool, etc.

    let active, tool, tool_type, tools;
    this._proxied_tools = [];

    const inspectors = {};
    const actions = {};
    const gestures = {};

    const new_help_tools = [];
    const new_help_urls = [];
    for (let helptool of Array.from(this.help)) {
      if (!includes(new_help_urls, helptool.redirect)) {
        new_help_tools.push(helptool);
        new_help_urls.push(helptool.redirect);
      }
    }
    this._proxied_tools.push(...Array.from(new_help_tools || []));
    this.help = new_help_tools;

    for (var event_type in this.gestures) {
      const info = this.gestures[event_type];
      if (!(event_type in gestures)) {
        gestures[event_type] = {};
      }
      for (tool of Array.from(info.tools)) {
        if (!(tool.type in gestures[event_type])) {
          gestures[event_type][tool.type] = [];
        }
        gestures[event_type][tool.type].push(tool);
      }
    }

    for (tool of Array.from(this.inspectors)) {
      if (!(tool.type in inspectors)) {
        inspectors[tool.type] = [];
      }
      inspectors[tool.type].push(tool);
    }

    for (tool of Array.from(this.actions)) {
      if (!(tool.type in actions)) {
        actions[tool.type] = [];
      }
      actions[tool.type].push(tool);
    }

    // Add a proxy for each of the groups of tools.
    const make_proxy = (tools, active) => {
      if (active == null) { active = false; }
      const proxy = new ToolProxy({tools, active});
      this._proxied_tools.push(proxy);
      return proxy;
    };

    for (event_type in gestures) {
      this.gestures[event_type].tools = [];
      for (tool_type in gestures[event_type]) {
        tools = gestures[event_type][tool_type];
        if (tools.length > 0) {
          const proxy = make_proxy(tools);
          this.gestures[event_type].tools.push(proxy);
          this.connect(proxy.properties.active.change, this._active_change.bind(this, proxy));
        }
      }
    }

    this.actions = [];
    for (tool_type in actions) {
      tools = actions[tool_type];
      if (tools.length > 0) {
        this.actions.push(make_proxy(tools));
      }
    }

    this.inspectors = [];
    for (tool_type in inspectors) {
      tools = inspectors[tool_type];
      if (tools.length > 0) {
        this.inspectors.push(make_proxy(tools, (active=true)));
      }
    }

    return (() => {
      const result = [];
      for (let et in this.gestures) {
        ({ tools } = this.gestures[et]);
        if (tools.length === 0) {
          continue;
        }
        this.gestures[et].tools = sortBy(tools, tool => tool.default_order);
        if (!(et == 'pinch' || et == 'scroll')) {
          result.push(this.gestures[et].tools[0].active = true);
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
}
ProxyToolbar.initClass();

export class ToolbarBoxView extends LayoutDOMView {
  static initClass() {
    this.prototype.className = 'bk-toolbar-box';
  }

  initialize(options) {
    super.initialize(options);
    this.model.toolbar.toolbar_location = this.model.toolbar_location;
    this._toolbar_views = {};
    return build_views(this._toolbar_views, [this.model.toolbar], {parent: this});
  }

  remove() {
    remove_views(this._toolbar_views);
    return super.remove();
  }

  render() {
    super.render();

    const toolbar = this._toolbar_views[this.model.toolbar.id];
    toolbar.render();

    empty(this.el);
    return this.el.appendChild(toolbar.el);
  }

  get_width() {
    if (this.model.toolbar.vertical) { return 30; } else { return null; }
  }

  get_height() {
    if (this.model.toolbar.horizontal) { return 30; } else { return null; }
  }
}
ToolbarBoxView.initClass();

export class ToolbarBox extends LayoutDOM {
  static initClass() {
    this.prototype.type = 'ToolbarBox';
    this.prototype.default_view = ToolbarBoxView;

    this.define({
      toolbar: [ p.Instance ],
      toolbar_location: [ p.Location, "right" ]
    });

    this.getters({
      // XXX: we are overriding LayoutDOM.sizing_mode here. That's a bad
      // hack, but currently every layoutable is allowed to have its
      // sizing mode configured, which is wrong. Another example of this
      // is PlotCanvas which only works with strech_both sizing mode.
      sizing_mode() {
        switch (this.toolbar_location) {
          case "above": case "below":
            return "scale_width";
          case "left": case "right":
            return "scale_height";
        }
      }
    });
  }
}
ToolbarBox.initClass();
