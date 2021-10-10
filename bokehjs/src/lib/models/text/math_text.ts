import * as p from "core/properties"
import {load_image} from "core/util/image"
import {color2hexrgb, color2rgba} from "core/util/color"
import {Size} from "core/types"
import {ImageTextBox} from "core/graphics"
import {FontMetrics, font_metrics, parse_css_length} from "core/util/text"
import {insert_text_on_position} from "core/util/string"
import {BaseText, BaseTextView} from "./base_text"
import {MathJaxProvider, default_provider} from "./providers"

/**
 * Helper class for rendering MathText into Canvas
 */
export abstract class MathTextView extends BaseTextView {
  override model: MathText

  protected image_box: ImageTextBox

  graphics(): ImageTextBox {
    return this.image_box
  }

  abstract styled_text(image_box: ImageTextBox): string

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()

    this.image_box = new ImageTextBox({text: this.model.text, image_loader: (image_box: ImageTextBox) => this.load_image(image_box)})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change(this.model.properties.text, () => {
      this.image_box = new ImageTextBox({text: this.model.text, image_loader: (image_box: ImageTextBox) => this.load_image(image_box)})
    })
  }

  private get_image_properties(svg_element: SVGElement, fmetrics: FontMetrics): Size & {v_align: number} {
    const heightEx = parseFloat(
      svg_element
        ?.getAttribute("height")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    const widthEx = parseFloat(
      svg_element
        ?.getAttribute("width")
        ?.replace(/([A-z])/g, "") ?? "0"
    )

    let v_align = 0
    const svg_styles = svg_element?.getAttribute("style")?.split(";")

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

  protected abstract _process_text(image_box: ImageTextBox): HTMLElement | undefined

  async load_image(image_box: ImageTextBox): Promise<void> {
    if (!this.image_box.image && (this.provider.status == "not_started" || this.provider.status == "loading")) {
      this.provider.ready.connect(() => this.load_image(image_box))
      this._has_finished = false
      return
    }

    if (!this._has_finished && (this.provider.status == "failed" || this.image_box.image)) {
      this._has_finished = true
      return this.parent.notify_finished_after_paint()
    }

    const mathjax_element = this._process_text(image_box)
    if (mathjax_element == null) {
      this._has_finished = true
      return this.parent.notify_finished_after_paint()
    }

    const svg_element = mathjax_element.children[0] as SVGElement

    const outer_HTML = svg_element.outerHTML
    const blob = new Blob([outer_HTML], {type: "image/svg+xml"})
    const url = URL.createObjectURL(blob)

    let svg_image: HTMLImageElement | null = null
    try {
      svg_image = await load_image(url)
    } finally {
      URL.revokeObjectURL(url)
    }

    image_box.image = svg_image
    image_box.image_properties = this.get_image_properties(svg_element, font_metrics(image_box.font))

    this.parent.request_layout()

    if (this.image_box.image) {
      this._has_finished = true
      this.parent.notify_finished_after_paint()
    }
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
  override styled_text(): string {
    return this.model.text
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

  override styled_text(image_box: ImageTextBox): string {
    let styled = image_box.text.trim()
    let matchs = styled.match(/<math(.*?[^?])?>/s)
    if (!matchs)
      return image_box.text.trim()

    styled = insert_text_on_position(
      styled,
      styled.indexOf(matchs[0]) +  matchs[0].length,
      `<mstyle displaystyle="true" mathcolor="${color2hexrgb(image_box.color)}">`
    )

    matchs = styled.match(/<\/[^>]*?math.*?>/s)
    if (!matchs)
      return image_box.text.trim()

    return insert_text_on_position(styled, styled.indexOf(matchs[0]), "</mstyle>")
  }

  protected _process_text(image_box: ImageTextBox): HTMLElement | undefined {
    const fmetrics = font_metrics(image_box.font)

    return this.provider.MathJax?.mathml2svg(this.styled_text(image_box), {
      em: image_box.base_font_size,
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

  override styled_text(image_box: ImageTextBox): string {
    const [r, g, b] = color2rgba(image_box.color)
    return `\\color[RGB]{${r}, ${g}, ${b}} ${image_box.text}`
  }

  protected _process_text(image_box: ImageTextBox): HTMLElement | undefined {
    // TODO: allow plot/document level configuration of macros
    const fmetrics = font_metrics(image_box.font)

    return this.provider.MathJax?.tex2svg(this.styled_text(image_box), {
      display: !this.model.inline,
      em: image_box.base_font_size,
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
