import {Axis} from "./axis"

export namespace ContinuousAxis {
  export interface Attrs extends Axis.Attrs {}

  export interface Props extends Axis.Props {}
}

export interface ContinuousAxis extends ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {

  properties: ContinuousAxis.Props

  constructor(attrs?: Partial<ContinuousAxis.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ContinuousAxis"
  }
}

ContinuousAxis.initClass()
