import {Text, TextView} from "./text"
import type {BaseText} from "../text/base_text"
import {MathTextView} from "../text/math_text"
import type {GraphicsBox} from "core/graphics"
import type * as p from "core/properties"
import type {ViewStorage, ChildView} from "core/build_views"
import {build_views} from "core/build_views"
import {enumerate} from "core/util/iterator"

export interface MathTextGlyphView extends MathTextGlyph.Data {}

export abstract class MathTextGlyphView extends TextView {
  declare model: MathTextGlyph
  declare visuals: MathTextGlyph.Visuals

  protected _label_views: ViewStorage<BaseText> = new Map()

  override _children_views(): ChildView[] {
    return [...super._children_views(), ...this._label_views.values()]
  }

  override has_finished(): boolean {
    if (!super.has_finished()) {
      return false
    }

    for (const view of this._label_views.values()) {
      if (!view.has_finished()) {
        return false
      }
    }

    return true
  }

  protected abstract _build_label(text: string): BaseText

  protected override _build_labels(text: p.Uniform<string | null>): (GraphicsBox | null)[] {
    const labels = Array.from(text, (text_i) => {
      return text_i == null ? null : this._build_label(text_i)
    })

    build_views(this._label_views, labels.filter((v) => v != null), {parent: this})

    return labels.map((label_i) => {
      return label_i == null ? null : this._label_views.get(label_i)!.graphics()
    })
  }

  override after_visuals(): void {
    super.after_visuals()

    // labels may be inherited from the base glyph, which owns their views
    for (const label_view of this._label_views.values()) {
      if (label_view instanceof MathTextView) {
        label_view.update_image()
      }
    }
  }

  /**
   * Sizes of math labels change when their images load, which happens
   * asynchronously, so update them whenever data is mapped (i.e. before
   * painting and computing the bbox), also for glyphs that inherit labels.
   */
  protected override _map_data(): void {
    super._map_data()

    const {left, right, top, bottom} = this.padding

    for (const [label, i] of enumerate(this.labels)) {
      if (!(label instanceof MathTextView)) {
        continue
      }

      const size = label.size()
      this.swidth[i] = left + size.width + right
      this.sheight[i] = top + size.height + bottom
    }
  }
}

export namespace MathTextGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Text.Props

  export type Visuals = Text.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface MathTextGlyph extends MathTextGlyph.Attrs {}

export abstract class MathTextGlyph extends Text {
  declare properties: MathTextGlyph.Props
  declare __view_type__: MathTextGlyphView

}
