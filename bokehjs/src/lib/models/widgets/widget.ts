import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import type {MathJaxProvider} from "models/text/providers"
import {default_provider} from "models/text/providers"

import type * as p from "core/properties"

export abstract class WidgetView extends LayoutDOMView {
  declare model: Widget

  get child_models(): LayoutDOM[] {
    return []
  }

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started") {
      await this.provider.fetch()
    }
  }

  override _after_layout(): void {
    super._after_layout()

    if (this.provider.status == "loading") {
      this._has_finished = false
    }
  }

  process_tex(text: string): string {
    if (this.provider.MathJax == null) {
      return text
    }

    const tex_parts = this.provider.MathJax.find_tex(text)
    const processed_text: string[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      processed_text.push(text.slice(last_index, part.start.n))
      processed_text.push(this.provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

      last_index = part.end.n
    }

    if (last_index! < text.length) {
      processed_text.push(text.slice(last_index))
    }

    return processed_text.join("")
  }

  protected contains_tex_string(text: string): boolean {
    if (this.provider.MathJax == null) {
      return false
    }

    return this.provider.MathJax.find_tex(text).length > 0
  };
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>
  export type Props = LayoutDOM.Props
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends LayoutDOM {
  declare properties: Widget.Props
  declare __view_type__: WidgetView

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Widget.Props>({
      margin: 5,
    })
  }
}
