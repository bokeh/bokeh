import {Control, ControlView} from "./control"
import {Orientation} from "core/enums"
import {BoxSizing, SizingPolicy} from "core/layout"
import * as p from "core/properties"

export abstract class OrientedControlView extends ControlView {
  override model: OrientedControl

  protected get default_size(): number | undefined {
    return this.model.default_size
  }

  protected override _width_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? super._width_policy() : "fixed"
  }

  protected override _height_policy(): SizingPolicy {
    return this.model.orientation == "horizontal" ? "fixed" : super._height_policy()
  }

  override box_sizing(): Partial<BoxSizing> {
    const sizing = super.box_sizing()
    if (this.model.orientation == "horizontal") {
      if (sizing.width == null)
        sizing.width = this.default_size
    } else {
      if (sizing.height == null)
        sizing.height = this.default_size
    }
    return sizing
  }
}

export namespace OrientedControl {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    orientation: p.Property<Orientation>
  }
}

export interface OrientedControl extends OrientedControl.Attrs {}

export abstract class OrientedControl extends Control {
  override properties: OrientedControl.Props
  override __view_type__: OrientedControlView

  constructor(attrs?: Partial<OrientedControl.Attrs>) {
    super(attrs)
  }

  static {
    this.define<OrientedControl.Props>(() => ({
      orientation: [ Orientation, "horizontal" ],
    }))
  }
}
