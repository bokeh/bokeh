import {Comparison} from "./comparison"
import {isNumber} from "core/util/types"
import type * as p from "core/properties"

export namespace NanSorter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Comparison.Props & {
    ascending_first: p.Property<boolean>
  }
}

export interface NanSorter extends NanSorter.Attrs {}

export class NanSorter extends Comparison {
  declare properties: NanSorter.Props

  constructor(attrs?: Partial<NanSorter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NanSorter.Props>(({Bool}) => ({
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
