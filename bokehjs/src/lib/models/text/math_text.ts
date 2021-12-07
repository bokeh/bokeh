import * as p from "core/properties"
import {BaseText, BaseTextView} from "./base_text"
import {AsciiBox, MathBox, MathMLBox, TeXBox} from "core/math_graphics"

/**
 * Helper class for rendering MathText into Canvas
 */
export abstract class MathTextView extends BaseTextView {
  override model: MathText

  override async lazy_initialize() {
    await super.lazy_initialize()
    await this.graphics().load_provider()
  }

  abstract override graphics(): MathBox
}

export namespace MathText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseText.Props & {
    text: p.Property<string>
  }
}

export interface MathText extends MathText.Attrs {}

export class MathText extends BaseText {
  override properties: MathText.Props
  override __view_type__: MathTextView

  constructor(attrs?: Partial<MathText.Attrs>) {
    super(attrs)
  }
}

export class AsciiView extends MathTextView {
  override model: Ascii

  graphics(): AsciiBox {
    return new AsciiBox({text: this.model.text})
  }
}

export namespace Ascii {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface Ascii extends Ascii.Attrs {}

export class Ascii extends MathText {
  override properties: Ascii.Props
  override __view_type__: AsciiView

  constructor(attrs?: Partial<Ascii.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AsciiView
  }
}

export class MathMLView extends MathTextView {
  override model: MathML

  graphics(): MathMLBox {
    return new MathMLBox({text: this.model.text})
  }
}

export namespace MathML {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MathText.Props
}

export interface MathML extends MathML.Attrs {}

export class MathML extends MathText {
  override properties: MathML.Props
  override __view_type__: MathMLView

  constructor(attrs?: Partial<MathML.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MathMLView
  }
}

export class TeXView extends MathTextView {
  override model: TeX

  graphics(): TeXBox {
    return new TeXBox({text: this.model.text})
  }
}

export namespace TeX {
  export type Attrs = p.AttrsOf<Props>

  export type Props = MathText.Props & {
    macros: p.Property<{[key: string]: string | [string, number]}>
    inline: p.Property<boolean>
  }
}

export interface TeX extends TeX.Attrs {}

export class TeX extends MathText {
  override properties: TeX.Props
  override __view_type__: TeXView

  constructor(attrs?: Partial<TeX.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeXView

    this.define<TeX.Props>(({Boolean, Number, String, Dict, Tuple, Or}) => ({
      macros: [ Dict(Or(String, Tuple(String, Number))), {} ],
      inline: [ Boolean, false ],
    }))
  }
}
