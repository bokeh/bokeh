import {Selector} from "./selector"
import type * as p from "core/properties"

export namespace ByCSS {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Selector.Props
}

export interface ByCSS extends ByCSS.Attrs {}

export class ByCSS extends Selector {
  declare properties: ByCSS.Props

  constructor(attrs?: Partial<ByCSS.Attrs>) {
    super(attrs)
  }

  find_one(target: ParentNode): Node | null {
    return target.querySelector(this.query)
  }
}
