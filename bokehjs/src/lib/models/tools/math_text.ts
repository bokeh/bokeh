import * as p from "core/properties"
import {Model} from "../../model"

export namespace MathText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface MathText extends MathText.Attrs {}

export class MathText extends Model {
  properties: MathText.Props

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }

  static init_MathText(): void {
    this.define<MathText.Props>(({String}) => ({
      text: [ String ],
    }))
  }
}
