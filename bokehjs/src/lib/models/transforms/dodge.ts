import {RangeTransform} from "./range_transform"
import type * as p from "core/properties"

export namespace Dodge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RangeTransform.Props & {
    value: p.Property<number>
  }
}

export interface Dodge extends Dodge.Attrs {}

export class Dodge extends RangeTransform {
  declare properties: Dodge.Props

  constructor(attrs?: Partial<Dodge.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Dodge.Props>(({Float}) => ({
      value: [ Float, 0 ],
    }))
  }

  protected _compute(x: number): number {
    return x + this.value
  }
}
