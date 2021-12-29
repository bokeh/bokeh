import {Model} from "../../model"
import {View} from "core/view"
import {GraphicsBox} from "core/graphics"
import * as p from "core/properties"
import {RendererView} from "models/renderers/renderer"

export abstract class BaseTextView extends View {
  override model: BaseText
  override readonly parent: RendererView

  abstract graphics(): GraphicsBox
}

export namespace BaseText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface BaseText extends BaseText.Attrs {}

export class BaseText extends Model {
  override properties: BaseText.Props
  override __view_type__: BaseTextView

  constructor(attrs?: Partial<BaseText.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseText.Props>(({String}) => ({
      text: [ String ],
    }))
  }
}
