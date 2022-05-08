import {Model} from "../../model"
import * as p from "core/properties"

export namespace Size {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    width: p.Property<number>
    height: p.Property<number>
  }
}

export interface Size extends Size.Attrs {}

export class Size extends Model {
  override properties: Size.Props

  constructor(attrs?: Partial<Size.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Size.Props>(({NonNegative, Int}) => ({
      width: [ NonNegative(Int) ],
      height: [ NonNegative(Int) ],
    }))
  }
}
