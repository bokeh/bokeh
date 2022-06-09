import {Model} from "model"
import {DOMComponentView} from "core/dom_view"
import * as p from "core/properties"

export abstract class IconView extends DOMComponentView {
  override model: Icon
}

export namespace Icon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    size: p.Property<number | string>
  }
}

export interface Icon extends Icon.Attrs {}

export abstract class Icon extends Model {
  override properties: Icon.Props
  override __view_type__: IconView

  constructor(attrs?: Partial<Icon.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Icon.Props>(({Number, String, Or}) => ({
      size: [ Or(Number, String /* TODO: CSSLength */), "inherit" ],
    }))
  }
}
