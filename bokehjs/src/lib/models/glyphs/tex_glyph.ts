import {MathTextGlyph, MathTextGlyphView} from "./math_text_glyph"
import type {BaseText} from "../text/base_text"
import {TeX} from "../text/math_text"
import type * as p from "core/properties"
import type {DictLike} from "core/types"
import {parse_delimited_string} from "../text/utils"

export interface TeXGlyphView extends TeXGlyph.Data {}

export class TeXGlyphView extends MathTextGlyphView {
  declare model: TeXGlyph
  declare visuals: TeXGlyph.Visuals

  protected _build_label(text: string): BaseText {
    const {macros, display} = this.model
    if (display == "auto") {
      const obj = parse_delimited_string(text)
      if (obj instanceof TeX) {
        obj.macros = macros
      }
      return obj
    } else {
      return new TeX({text, macros, inline: display == "inline"})
    }
  }
}

export namespace TeXGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MathTextGlyph.Props & {
    macros: p.Property<DictLike<string | [string, number]>>
    display: p.Property<"inline" | "block" | "auto">
  }

  export type Visuals = MathTextGlyph.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface TeXGlyph extends TeXGlyph.Attrs {}

export class TeXGlyph extends MathTextGlyph {
  declare properties: TeXGlyph.Props
  declare __view_type__: TeXGlyphView

  constructor(attrs?: Partial<TeXGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeXGlyphView

    this.define<TeXGlyph.Props>(({Enum, Number, String, Dict, Tuple, Or, Auto}) => ({
      macros: [ Dict(Or(String, Tuple(String, Number))), {} ],
      display: [ Or(Enum("inline", "block"), Auto), "auto" ],
    }))
  }
}
