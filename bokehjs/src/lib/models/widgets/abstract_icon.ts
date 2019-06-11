import {Model} from "model"
import {DOMView} from "core/dom_view"
import * as p from "core/properties"

export abstract class AbstractIconView extends DOMView {
  model: AbstractIcon
}

export namespace AbstractIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface AbstractIcon extends AbstractIcon.Attrs {}

export abstract class AbstractIcon extends Model {
  properties: AbstractIcon.Props

  constructor(attrs?: Partial<AbstractIcon.Attrs>) {
    super(attrs)
  }
}
