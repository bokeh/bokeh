import {Axis} from "./axis"

export namespace ContinuousAxis {
  export interface Attrs extends Axis.Attrs {}

  export interface Opts extends Axis.Opts {}
}

export interface ContinuousAxis extends ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {

  constructor(attrs?: Partial<ContinuousAxis.Attrs>, opts?: ContinuousAxis.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "ContinuousAxis"
  }
}

ContinuousAxis.initClass()
