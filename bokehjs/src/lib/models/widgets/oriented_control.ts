import {Widget, WidgetView} from "./widget"
import {Orientation} from "core/enums"
import type * as p from "core/properties"

// TODO rename to OrientedWidget
export abstract class OrientedControlView extends WidgetView {
  declare readonly model: OrientedControl
  declare readonly signals: p.SignalsOf<OrientedControl.Props>
  declare readonly values: OrientedControl.Attrs
}

export namespace OrientedControl {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    orientation: p.Property<Orientation>
  }
}

export interface OrientedControl extends OrientedControl.Attrs {}

export abstract class OrientedControl extends Widget {
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
