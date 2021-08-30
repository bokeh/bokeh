import * as p from "core/properties"
import {Model} from "../../model"

export namespace PlainText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface PlainText extends PlainText.Attrs {}

export class PlainText extends Model {
  override properties: PlainText.Props

  constructor(attrs?: Partial<PlainText.Attrs>) {
    super(attrs)
  }

  static {
    this.define<PlainText.Props>(({String}) => ({
      text: [ String ],
    }))
  }
}
