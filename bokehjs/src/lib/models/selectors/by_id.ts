import {Selector} from "./selector"
import type * as p from "core/properties"

export namespace ByID {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Selector.Props
}

export interface ByID extends ByID.Attrs {}

export class ByID extends Selector {
  declare properties: ByID.Props

  constructor(attrs?: Partial<ByID.Attrs>) {
    super(attrs)
  }

  find_one(target: ParentNode): Node | null {
    return target.querySelector(`#${this.query}`)
  }
}
