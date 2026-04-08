import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import {Widget, WidgetView} from "./widget"

import * as markup_css from "styles/widgets/markup.css"

export abstract class MarkupView extends WidgetView {
  declare readonly model: Markup
  declare readonly signals: p.SignalsOf<Markup.Props>

  protected override readonly _auto_width = "fit-content"
  protected override readonly _auto_height = "auto"

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started" || this.provider.status == "loading") {
      this.provider.ready.connect(() => {
        if (this.contains_tex_string(this.model.text)) {
          this.rerender()
        }
      })
    }
  }

  has_math_disabled(): boolean {
    return this.model.disable_math || !this.contains_tex_string(this.model.text)
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), markup_css.default]
  }

  override _after_render(): void {
    super._after_render()

    if (this.provider.status == "failed" || this.provider.status == "loaded") {
      this._has_finished = true
    }
  }
}

export namespace Markup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    text: p.Property<string>
    disable_math: p.Property<boolean>
  }
}

export interface Markup extends Markup.Attrs {}

export abstract class Markup extends Widget {
  declare properties: Markup.Props
  declare __view_type__: MarkupView

  constructor(attrs?: Partial<Markup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Markup.Props>(({Bool, Str}) => ({
      text: [ Str, "" ],
      disable_math: [ Bool, false ],
    }))
  }
}
