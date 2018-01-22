/* XXX: partial */
import * as p from "core/properties";
import {Signal} from "core/signaling";
import {Model} from "../../model"

export class ToolProxy extends Model {
  static initClass() {
    this.define({
      tools:    [ p.Array, []    ],
      active:   [ p.Bool,  false ],
      disabled: [ p.Bool,  false ]
    });
  }
  // Operates all the tools given only one button

  get button_view() {
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
    this.connect(this.do, function() { return this.doit(); });
    this.connect(this.properties.active.change, function() { return this.set_active(); });
  }

  doit() {
    for (const tool of this.tools) {
      tool.do.emit(undefined);
    }
    return null;
  }

  set_active() {
    for (const tool of this.tools) {
      tool.active = this.active;
    }
    return null;
  }

  _clicked() {
    const { active } = this.model;
    return this.model.active = !active;
  }
}
ToolProxy.initClass();
