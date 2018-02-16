/* XXX: partial */
import {logger} from "core/logging";
import {empty, div, a} from "core/dom";
import {build_views, remove_views} from "core/build_views";
import * as p from "core/properties";

import {DOMView} from "core/dom_view";
import {Logo, Location} from "core/enums";
import {Model} from "model";
import {Tool} from "./tool"
import {ButtonToolButtonView} from "./button_tool"

export class ToolbarBaseView extends DOMView {
  model: ToolbarBase

  initialize(options: any): void {
    super.initialize(options);
    this._tool_button_views = {};
    this._build_tool_button_views();
  }

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.properties.tools.change, () => this._build_tool_button_views());
  }

  remove() {
    remove_views(this._tool_button_views);
    return super.remove();
  }

  _build_tool_button_views(): ButtonToolButtonView[] {
    const tools = this.model._proxied_tools != null ? this.model._proxied_tools : this.model.tools; // XXX
    return build_views(this._tool_button_views, tools, {parent: this}, tool => tool.button_view);
  }

  render() {
    let buttons
    empty(this.el);

    this.el.classList.add("bk-toolbar");
    this.el.classList.add(`bk-toolbar-${this.model.toolbar_location}`);

    if (this.model.logo != null) {
      const cls = this.model.logo === "grey" ? "bk-grey" : null;
      const logo = a({href: "https://bokeh.pydata.org/", target: "_blank", class: ["bk-logo", "bk-logo-small", cls]});
      this.el.appendChild(logo);
    }

    const bars = [];

    const { gestures } = this.model;
    for (const et in gestures) {
      buttons = [];
      for (const tool of gestures[et].tools) {
        buttons.push(this._tool_button_views[tool.id].el);
      }
      bars.push(buttons);
    }

    buttons = [];
    for (const tool of this.model.actions) {
      buttons.push(this._tool_button_views[tool.id].el);
    }
    bars.push(buttons);

    buttons = [];
    for (const tool of this.model.inspectors) {
      if (tool.toggleable) {
        buttons.push(this._tool_button_views[tool.id].el);
      }
    }
    bars.push(buttons);

    buttons = [];
    for (const tool of this.model.help) {
      buttons.push(this._tool_button_views[tool.id].el);
    }
    bars.push(buttons);

    for (const bar of bars) {
      if (bar.length !== 0) {
        const el = div({class: 'bk-button-bar'}, bar);
        this.el.appendChild(el);
      }
    }

    return this;
  }
}

export namespace ToolbarBase {
  export interface Attrs extends Model.Attrs {
    tools: Tool[]
    logo: Logo
    gestures: {
      pan:       { tools: Tool[], active: Tool | null },
      scroll:    { tools: Tool[], active: Tool | null },
      pinch:     { tools: Tool[], active: Tool | null },
      tap:       { tools: Tool[], active: Tool | null },
      doubletap: { tools: Tool[], active: Tool | null },
      press:     { tools: Tool[], active: Tool | null },
      rotate:    { tools: Tool[], active: Tool | null },
      move:      { tools: Tool[], active: Tool | null },
      multi:     { tools: Tool[], active: Tool | null },
    },
    actions: Tool[]
    inspectors: Tool[]
    help: Tool[]
    toolbar_location: Location
  }

  export interface Opts extends Model.Opts {}
}

export interface ToolbarBase extends ToolbarBase.Attrs {}

export class ToolbarBase extends Model {

  constructor(attrs?: Partial<ToolbarBase.Attrs>, opts?: ToolbarBase.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = 'ToolbarBase';
    this.prototype.default_view = ToolbarBaseView;

    this.define({
      tools: [ p.Array,    []       ],
      logo:  [ p.String,   'normal' ], // TODO (bev)
    });

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
      actions:    [ p.Array, [] ],
      inspectors: [ p.Array, [] ],
      help:       [ p.Array, [] ],
      toolbar_location: [ p.Location, 'right' ],
    });
  }

  get horizontal(): boolean {
    return this.toolbar_location === "above" || this.toolbar_location === "below"
  }

  get vertical(): boolean {
    return this.toolbar_location === "left" || this.toolbar_location === "right"
  }

  _active_change(tool) {
    let event_types = tool.event_type;

    if (typeof event_types === 'string') {
      event_types = [event_types];
    }

    for (const et of event_types) {
      if (tool.active) {
        const currently_active_tool = this.gestures[et].active;
        if ((currently_active_tool != null) && (tool !== currently_active_tool)) {
          logger.debug(`Toolbar: deactivating tool: ${currently_active_tool.type} (${currently_active_tool.id}) for event type '${et}'`);
          currently_active_tool.active = false;
        }
        this.gestures[et].active = tool;
        logger.debug(`Toolbar: activating tool: ${tool.type} (${tool.id}) for event type '${et}'`);
      } else {
        this.gestures[et].active = null;
      }
    }

    return null;
  }
}
ToolbarBase.initClass();
