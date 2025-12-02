import {Model} from "../../model"
import {View} from "core/view"
import type {GraphicsBox} from "core/graphics"
import type * as p from "core/properties"
import type {RendererView} from "models/renderers/renderer"
import type {GlyphView} from "models/glyphs/glyph"

export abstract class BaseTextView extends View {
  declare model: BaseText
  declare readonly parent: RendererView | GlyphView

  abstract graphics(): GraphicsBox

  clone_graphics(): GraphicsBox {
    return this.graphics()
  }

  abstract html(): Node
}

export namespace BaseText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    text: p.Property<string>
  }
}

export interface BaseText extends BaseText.Attrs {}

export class BaseText extends Model {
  declare properties: BaseText.Props
  declare __view_type__: BaseTextView

  static {
    this.define<BaseText.Props>(({Str}) => ({
      text: [ Str ],
    }))
  }
}
