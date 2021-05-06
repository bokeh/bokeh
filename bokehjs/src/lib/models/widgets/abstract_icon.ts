import {Model} from "model"
import {DOMComponentView} from "core/dom_view"
import * as p from "core/properties"

export abstract class AbstractIconView extends DOMComponentView {
  override model: AbstractIcon
  override el: HTMLElement
}

export namespace AbstractIcon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface AbstractIcon extends AbstractIcon.Attrs {}

export abstract class AbstractIcon extends Model {
  override properties: AbstractIcon.Props
  override __view_type__: AbstractIconView

  constructor(attrs?: Partial<AbstractIcon.Attrs>) {
    super(attrs)
  }
}
