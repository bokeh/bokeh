import {Comparison} from "./comparison"
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

  protected compute(x: any, y: any): number {
    if (isNaN(x)) {
      return this.ascending_first ? -1 : 1
    }
    if (isNaN(y)) {
      return this.ascending_first ? 1 : -1
    }
    return x==y ? 0 : x < y ? -1 : 1
  }
}
