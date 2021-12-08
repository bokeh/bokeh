import {Model} from "../../model"
import {View} from "core/view"
import * as p from "core/properties"
import {RendererView} from "models/renderers/renderer"
import {TextBox} from "core/graphics"
import {MathBox} from "core/math_graphics"

export abstract class BaseTextView extends View {
  override model: BaseText
  override parent: RendererView

  override initialize(): void {
    super.initialize()
    this._has_finished = true
  }

  abstract graphics(): MathBox | TextBox
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
