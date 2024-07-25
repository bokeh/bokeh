import {Comparison} from "./comparison"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"

export namespace NanCompare {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Comparison.Props & {
    ascending_first: p.Property<boolean>
  }
}

export interface NanCompare extends NanCompare.Attrs {}

export class NanCompare extends Comparison {
  declare properties: NanCompare.Props

  constructor(attrs?: Partial<NanCompare.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NanCompare.Props>(({Bool}) => ({
      ascending_first: [ Bool, false ],
    }))
  }

  compute(x: unknown, y: unknown):  0 | 1 | -1 {
    if (isNumber(x) && isNaN(x)) {
      return this.ascending_first ? -1 : 1
    }
    if (isNumber(y) && isNaN(y)) {
      return this.ascending_first ? 1 : -1
    }
    if (isNumber(x) && isNumber(y)) {
      return x==y ? 0 : x < y ? -1 : 1
    }
    return 0
  }
}
