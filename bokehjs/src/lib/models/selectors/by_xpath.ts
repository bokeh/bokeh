import {Selector} from "./selector"
import type * as p from "core/properties"

export namespace ByXPath {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Selector.Props
}

export interface ByXPath extends ByXPath.Attrs {}

export class ByXPath extends Selector {
  declare properties: ByXPath.Props

  constructor(attrs?: Partial<ByXPath.Attrs>) {
    super(attrs)
  }

  find_one(target: ParentNode): Node | null {
    return document.evaluate(this.query, target).iterateNext()
  }
}
