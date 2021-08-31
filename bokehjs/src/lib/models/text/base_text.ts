import {Model} from "../../model"
import * as p from "core/properties"

export namespace BaseText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface BaseText extends BaseText.Attrs {}

export class BaseText extends Model {
  override properties: BaseText.Props

  constructor(attrs?: Partial<BaseText.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseText.Props>(({String}) => ({
      text: [ String ],
    }))
  }
}
