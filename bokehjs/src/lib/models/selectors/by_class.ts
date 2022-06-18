import {Selector} from "./selector"
import * as p from "core/properties"

export namespace ByClass {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Selector.Props
}

export interface ByClass extends ByClass.Attrs {}

export class ByClass extends Selector {
  override properties: ByClass.Props

  constructor(attrs?: Partial<ByClass.Attrs>) {
    super(attrs)
  }

  find_one(target: ParentNode): Node | null {
    return target.querySelector(`.${this.query}`)
  }
}
