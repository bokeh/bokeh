import {Model} from "../../model"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
//import {NonNegative, Int} from "core/kinds"

export namespace BoxVisuals {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    //width: p.Property<number>
    //height: p.Property<number>
  } & Mixins

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

export interface BoxVisuals extends BoxVisuals.Attrs {}

export class BoxVisuals extends Model {
  declare properties: BoxVisuals.Props

  constructor(attrs?: Partial<BoxVisuals.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<BoxVisuals.Mixins>([
      mixins.Line,
      mixins.Fill,
      mixins.Hatch,
      ["hover_", mixins.Line],
      ["hover_", mixins.Fill],
      ["hover_", mixins.Hatch],
    ])

    this.define<BoxVisuals.Props>({
      //width: [ NonNegative(Int), 10 ],
      //height: [ NonNegative(Int), 10 ],
    })
  }
}
