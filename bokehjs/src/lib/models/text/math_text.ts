import {ImageTextBox} from "core/graphics"
import * as p from "core/properties"
import {Size} from "core/types"
import {color2hexrgb, color2rgba} from "core/util/color"
import {load_image} from "core/util/image"
import {insert_text_on_position} from "core/util/string"
import {font_metrics, parse_css_length} from "core/util/text"
import {CanvasImage} from "models/glyphs/image_url"
import {BaseText, BaseTextView} from "./base_text"
import {default_provider, MathJaxProvider} from "./providers"

/**
 * Helper class for rendering MathText into Canvas
 */
export abstract class MathTextView extends BaseTextView {
  override model: MathText

  protected image_box: ImageTextBox
  private svg_image: CanvasImage | null = null
  private svg_element: SVGElement

  graphics(): ImageTextBox {
    return this.image_box
  }

  get text(): string {
    return this.model.text
  }

  abstract get styled_text(): string

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()

    const {text} = this
    this.image_box = new ImageTextBox({text, load_image: () => this.load_image()})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change(this.model.properties.text, () => {
      this.svg_image = null
      this.load_image()
    })
  }

  private get_image_properties(): Size & {v_align: number} {
    const fmetrics = font_metrics(this.image_box.font)

    const heightEx = parseFloat(
      this.svg_element
        .getAttribute("height")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    const widthEx = parseFloat(
      this.svg_element
        .getAttribute("width")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    let v_align = 0
    const svg_styles = this.svg_element?.getAttribute("style")?.split(";")

    if (svg_styles) {
      const rulesMap = new Map()
      svg_styles.forEach(property => {
        const [rule, value] = property.split(":")
        if (rule) rulesMap.set(rule.trim(), value.trim())
      })
      const v_align_length = parse_css_length(rulesMap.get("vertical-align"))
      if (v_align_length?.unit == "ex") {
        v_align = v_align_length.value * fmetrics.x_height
      } else if (v_align_length?.unit == "px") {
        v_align = v_align_length.value
      }
    }

    return {
      width: fmetrics.x_height * widthEx,
      height: fmetrics.x_height * heightEx,
      v_align,
    }
  }

  protected abstract _process_text(): HTMLElement | undefined

  private async load_image(): Promise<void> {
    if (!this.svg_image && (this.provider.status == "not_started" || this.provider.status == "loading")) {
      this.provider.ready.connect(() => this.load_image())
      this._has_finished = false
      return
    }

    if (!this._has_finished && (this.provider.status == "failed" || this.svg_image)) {
      this._has_finished = true
      return this.parent.notify_finished_after_paint()
    }

    const mathjax_element = this._process_text()
    if (mathjax_element == null) {
      this._has_finished = true
      return this.parent.notify_finished_after_paint()
    }

    const svg_element = mathjax_element.children[0] as SVGElement
    this.svg_element = svg_element

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: "image/svg+xml"})
    const url = URL.createObjectURL(blob)

    try {
      this.svg_image = await load_image(url)
    } finally {
      URL.revokeObjectURL(url)
    }

    this.image_box.image = this.svg_image
    this.image_box.image_properties = this.get_image_properties()

    this.parent.request_layout()
    this._has_finished = true
    this.parent.notify_finished_after_paint()
  }
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

  // TODO: Color ascii
  override get styled_text(): string {
    return this.text
  }

  protected _process_text(): HTMLElement | undefined {
    return undefined // TODO: this.provider.MathJax?.ascii2svg(text)
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

  override get styled_text(): string {
    let styled = this.text.trim()
    let matchs = styled.match(/<math(.*?[^?])?>/s)
    if (!matchs)
      return this.text.trim()

    styled = insert_text_on_position(
      styled,
      styled.indexOf(matchs[0]) +  matchs[0].length,
      `<mstyle displaystyle="true" mathcolor="${color2hexrgb(this.image_box.color)}">`
    )

    matchs = styled.match(/<\/[^>]*?math.*?>/s)
    if (!matchs)
      return this.text.trim()

    return insert_text_on_position(styled, styled.indexOf(matchs[0]), "</mstyle>")
  }

  protected _process_text(): HTMLElement | undefined {
    const fmetrics = font_metrics(this.image_box.font)

    return this.provider.MathJax?.mathml2svg(this.styled_text, {
      em: this.image_box.base_font_size,
      ex: fmetrics.x_height,
    })
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

  override get styled_text(): string {
    const [r, g, b] = color2rgba(this.image_box.color)
    return `\\color[RGB]{${r}, ${g}, ${b}} ${this.text}`
  }

  protected _process_text(): HTMLElement | undefined {
    // TODO: allow plot/document level configuration of macros
    const fmetrics = font_metrics(this.image_box.font)

    return this.provider.MathJax?.tex2svg(this.styled_text, {
      display: !this.model.inline,
      em: this.image_box.base_font_size,
      ex: fmetrics.x_height,
    }, this.model.macros)
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
