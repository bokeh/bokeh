import {Control, ControlView} from "./control"
import {Orientation} from "core/enums"
import type * as p from "core/properties"

export abstract class OrientedControlView extends ControlView {
  declare readonly model: OrientedControl
  declare readonly signals: p.SignalsOf<OrientedControl.Props>
  declare readonly values: OrientedControl.Attrs
}

export namespace OrientedControl {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    orientation: p.Property<Orientation>
  }
}

export interface OrientedControl extends OrientedControl.Attrs {}

export abstract class OrientedControl extends Control {
  declare properties: OrientedControl.Props
  declare __view_type__: OrientedControlView

  constructor(attrs?: Partial<OrientedControl.Attrs>) {
    super(attrs)
  }

  static {
    this.define<OrientedControl.Props>(() => ({
      orientation: [ Orientation, "horizontal" ],
    }))
  }
}
