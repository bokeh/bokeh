import {RangeTransform} from "./range_transform"
import * as p from "core/properties"

export namespace Dodge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RangeTransform.Props & {
    value: p.Property<number>
  }
}

export interface Dodge extends Dodge.Attrs {}

export class Dodge extends RangeTransform {
  properties: Dodge.Props

  constructor(attrs?: Partial<Dodge.Attrs>) {
    super(attrs)
  }

  static init_Dodge(): void {
    this.define<Dodge.Props>({
      value: [ p.Number,  0 ],
    })
  }

  protected _compute(x: number): number {
    return x + this.value
  }
}
