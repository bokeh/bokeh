import {Axis} from "./axis"

export class ContinuousAxis extends Axis {
  static initClass() {
    this.prototype.type = "ContinuousAxis"
  }
}

ContinuousAxis.initClass()
