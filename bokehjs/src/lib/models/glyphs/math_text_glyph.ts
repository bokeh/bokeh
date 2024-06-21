import {Text, TextView} from "./text"
import type {BaseText} from "../text/base_text"
import {MathTextView} from "../text/math_text"
import type {GraphicsBox} from "core/graphics"
import type * as p from "core/properties"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {enumerate} from "core/util/iterator"

export interface MathTextGlyphView extends MathTextGlyph.Data {}

export abstract class MathTextGlyphView extends TextView {
  declare model: MathTextGlyph
  declare visuals: MathTextGlyph.Visuals

  protected _label_views: ViewStorage<BaseText> = new Map()

  override remove(): void {
    remove_views(this._label_views)
    super.remove()
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this._label_views.values()
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

  protected override async _build_labels(text: p.Uniform<string | null>): Promise<(GraphicsBox | null)[]> {
    const labels = Array.from(text, (text_i) => {
      return text_i == null ? null : this._build_label(text_i)
    })

    await build_views(this._label_views, labels.filter((v) => v != null), {parent: this.renderer})

    return labels.map((label_i) => {
      return label_i == null ? null : this._label_views.get(label_i)!.graphics()
    })
  }

  override async after_lazy_visuals(): Promise<void> {
    await super.after_lazy_visuals()

    const promises = [...this._label_views.values()].map((label_view) => {
      if (label_view instanceof MathTextView) {
        return label_view.request_image()
      } else {
        return null
      }
    })
    await Promise.allSettled(promises)

    const {left, right, top, bottom} = this.padding

    for (const [label, i] of enumerate(this.labels)) {
      if (label == null) {
        continue
      }
      if (!(label instanceof MathTextView)) {
        continue
      }

      const size = label.size()
      const width = left + size.width + right
      const height = top + size.height + bottom

      this.swidth[i] = width
      this.sheight[i] = height
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

  constructor(attrs?: Partial<MathTextGlyph.Attrs>) {
    super(attrs)
  }
}
