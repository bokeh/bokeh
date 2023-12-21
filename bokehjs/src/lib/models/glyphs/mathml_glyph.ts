import {MathTextGlyph, MathTextGlyphView} from "./math_text_glyph"
import {MathML} from "../text/math_text"
import type * as p from "core/properties"

export interface MathMLGlyphView extends MathMLGlyph.Data {}

export class MathMLGlyphView extends MathTextGlyphView {
  declare model: MathMLGlyph
  declare visuals: MathMLGlyph.Visuals

  protected _build_label(text: string): MathML {
    return new MathML({text})
  }
}

export namespace MathMLGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MathTextGlyph.Props

  export type Visuals = MathTextGlyph.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface MathMLGlyph extends MathMLGlyph.Attrs {}

export class MathMLGlyph extends MathTextGlyph {
  declare properties: MathMLGlyph.Props
  declare __view_type__: MathMLGlyphView

  constructor(attrs?: Partial<MathMLGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MathMLGlyphView
  }
}
