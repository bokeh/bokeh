import {DOMNode, DOMNodeView} from "./dom_node"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex} from "core/util/templating"
import * as p from "core/properties"

export abstract class PlaceholderView extends DOMNodeView {
  declare model: Placeholder
  static override tag_name = "span" as const

  override render(): void {
    // XXX: no implementation?
  }

  abstract update(source: ColumnarDataSource, i: DataIndex | null, vars: object/*, formatters?: Formatters*/): void
}

export namespace Placeholder {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMNode.Props
}

export interface Placeholder extends Placeholder.Attrs {}

export abstract class Placeholder extends DOMNode {
  declare properties: Placeholder.Props
  declare __view_type__: PlaceholderView

  constructor(attrs?: Partial<Placeholder.Attrs>) {
    super(attrs)
  }
}
