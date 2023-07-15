import {DOMView} from "core/dom_view"
import {Model} from "../../model"
import type * as p from "core/properties"

export abstract class DOMNodeView extends DOMView {
  declare model: DOMNode
}

export namespace DOMNode {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DOMNode extends DOMNode.Attrs {}

export abstract class DOMNode extends Model {
  declare properties: DOMNode.Props
  declare __view_type__: DOMNodeView
  static override __module__ = "bokeh.models.dom"

  constructor(attrs?: Partial<DOMNode.Attrs>) {
    super(attrs)
  }
}
