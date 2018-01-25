import {Axis} from "./axis"

export namespace ContinuousAxis {
  export interface Attrs extends Axis.Attrs {}
}

export interface ContinuousAxis extends Axis, ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {
  static initClass() {
    this.prototype.type = "ContinuousAxis"
  }
}

ContinuousAxis.initClass()
