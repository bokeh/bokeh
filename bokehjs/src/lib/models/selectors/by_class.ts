import {Selector} from "./selector"
import type * as p from "core/properties"

export namespace ByClass {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Selector.Props
}

export interface ByClass extends ByClass.Attrs {}

export class ByClass extends Selector {
  declare properties: ByClass.Props

  find_one(target: ParentNode): Node | null {
    return target.querySelector(`.${this.query}`)
  }
}
