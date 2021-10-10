import {GraphicsContainer, ImageTextBox, is_image_box, TextBox} from "core/graphics"
import {BaseText, BaseTextView} from "./base_text"
import {MathTextView, MathText, TeXView, TeX} from "./math_text"
import {build_view} from "core/build_views"

export abstract class MathAndTextView extends BaseTextView {
  protected graphics_container: GraphicsContainer

  abstract math_view: MathTextView
  abstract math_model: MathText

  graphics(): GraphicsContainer {
    return this.graphics_container
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    this.math_view = await build_view(this.math_model, {parent: this.parent})
    this.graphics_container = new GraphicsContainer(this.parse_math_parts())
  }

  override connect_signals(): void {
    super.connect_signals()
    this.on_change(this.model.properties.text, () => {
      this.graphics_container = new GraphicsContainer(this.parse_math_parts())
    })
  }

  private has_images_loaded() {
    return this.graphics().items.filter(is_image_box).every(({image}) => image)
  }

  protected abstract parse_math_parts(): TextBox[]

  override has_finished(): boolean {
    return super.has_finished() && this.has_images_loaded()
  }

  override remove(): void {
    this.math_view?.remove()

    super.remove()
  }
}

export class TeXAndTextView extends MathAndTextView {
  override model: TeXAndText

  override math_view: TeXView
  override math_model: TeX = new TeX()

  protected parse_math_parts(): TextBox[] {
    if (!this.math_view.provider.MathJax)
      return []

    const {text} = this.model
    // TODO: find mathml
    const tex_parts = this.math_view.provider.MathJax.find_tex(text)
    const parts: TextBox[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      const _text = text.slice(last_index, part.start.n)
      if (_text)
        parts.push(new TextBox({text: _text}))

      // TODO:  display mode
      parts.push(new ImageTextBox({text: part.math, image_loader: (image_box: ImageTextBox) => this.math_view.load_image(image_box)}))

      last_index = part.end.n
    }

    if (last_index! < text.length) {
      parts.push(new TextBox({text: text.slice(last_index)}))
    }

    return parts
  }
}

export class TeXAndText extends BaseText {
  override __view_type__: TeXAndTextView

  static {
    this.prototype.default_view = TeXAndTextView
  }
}
