import {Model} from "../../model"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"

export namespace AreaVisuals {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {} & Mixins

  export type Mixins =
    mixins.Line & mixins.Fill & mixins.Hatch &
    mixins.HoverLine & mixins.HoverFill & mixins.HoverHatch

  export type Visuals = {
    line: visuals.Line
    fill: visuals.Fill
    hatch: visuals.Hatch
    hover_line: visuals.Line
    hover_fill: visuals.Fill
    hover_hatch: visuals.Hatch
  }
}

export interface AreaVisuals extends AreaVisuals.Attrs {}

export class AreaVisuals extends Model {
  declare properties: AreaVisuals.Props

  constructor(attrs?: Partial<AreaVisuals.Attrs>) {
    super(attrs)
  }

  override clone(attrs?: Partial<AreaVisuals.Attrs>): this {
    return super.clone(attrs)
  }

  static {
    this.mixins<AreaVisuals.Mixins>([
      mixins.Line,
      mixins.Fill,
      mixins.Hatch,
      ["hover_", mixins.Line],
      ["hover_", mixins.Fill],
      ["hover_", mixins.Hatch],
    ])
  }
}
