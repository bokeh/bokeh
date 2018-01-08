/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as p from "core/properties";
import {Signal} from "core/signaling";
import {Model} from "../../model"
;

export class ToolProxy extends Model {
  static initClass() {

    this.getters({
      button_view() { return this.tools[0].button_view; },
      event_type() { return this.tools[0].event_type; },
      tooltip() { return this.tools[0].tool_name; },
      tool_name() { return this.tools[0].tool_name; },
      icon() { return this.tools[0].icon; }
    });

    this.define({
      tools:    [ p.Array, []    ],
      active:   [ p.Bool,  false ],
      disabled: [ p.Bool,  false ]
    });
  }
  // Operates all the tools given only one button

  initialize(options) {
    super.initialize(options);
    this.do = new Signal(this, "do");
    this.connect(this.do, function() { return this.doit(); });
    return this.connect(this.properties.active.change, function() { return this.set_active(); });
  }

  doit() {
    for (let tool of Array.from(this.tools)) {
      tool.do.emit();
    }
    return null;
  }

  set_active() {
    for (let tool of Array.from(this.tools)) {
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
