/* XXX: partial */
import * as p from "core/properties";
import {Signal} from "core/signaling";
import {Class} from "core/class"
import {Model} from "../../model"
import {ButtonTool, ButtonToolButtonView} from "./button_tool"

export namespace ToolProxy {
  export interface Attrs extends Model.Attrs {
    tools: ButtonTool[]
    active: boolean
    disabled: boolean
  }

  export interface Opts extends Model.Opts {}
}

export interface ToolProxy extends ToolProxy.Attrs {}

export class ToolProxy extends Model {

  constructor(attrs?: Partial<ToolProxy.Attrs>, opts?: ToolProxy.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "ToolProxy"

    this.define({
      tools:    [ p.Array, []    ],
      active:   [ p.Bool,  false ],
      disabled: [ p.Bool,  false ],
    });
  }

  do: Signal<void, this>

  // Operates all the tools given only one button

  get button_view(): Class<ButtonToolButtonView> {
    return this.tools[0].button_view
  }

  get event_type() {
    return this.tools[0].event_type
  }

  get tooltip() {
    return this.tools[0].tool_name
  }

  get tool_name() {
    return this.tools[0].tool_name
  }

  get icon() {
    return this.tools[0].icon
  }

  initialize(): void {
    super.initialize();
    this.do = new Signal(this, "do");
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.do, () => this.doit())
    this.connect(this.properties.active.change, () => this.set_active())
  }

  doit(): void {
    for (const tool of this.tools) {
      tool.do.emit(undefined);
    }
  }

  set_active(): void {
    for (const tool of this.tools) {
      tool.active = this.active;
    }
  }

  protected _clicked(): void {
    const {active} = this.model
    this.model.active = !active
  }
}
ToolProxy.initClass();
