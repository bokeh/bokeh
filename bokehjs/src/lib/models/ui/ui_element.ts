import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import * as p from "core/properties"

export abstract class UIElementView extends DOMComponentView {
  override model: UIElement
}

export namespace UIElement {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export abstract class UIElement extends Model {
  override properties: UIElement.Props
  override __view_type__: UIElementView

  constructor(attrs?: Partial<UIElement.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UIElement.Props>(({Boolean}) => ({
      visible: [ Boolean, true ],
    }))
  }
}
