import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {default_provider, MathJaxProvider} from "models/text/providers"

import * as p from "core/properties"

export abstract class WidgetView extends LayoutDOMView {
  override model: Widget

  get child_models(): LayoutDOM[] {
    return []
  }

  get provider(): MathJaxProvider {
    return default_provider
  }

  override async lazy_initialize() {
    await super.lazy_initialize()

    if (this.provider.status == "not_started")
      await this.provider.fetch()
  }

  override after_layout(): void {
    super.after_layout()

    if (this.provider.status == "loading")
      this._has_finished = false
  }

  process_tex(text: string): string {
    if (!this.provider.MathJax)
      return text

    const tex_parts = this.provider.MathJax.find_tex(text)
    const processed_text: string[] = []

    let last_index: number | undefined = 0
    for (const part of tex_parts) {
      processed_text.push(text.slice(last_index, part.start.n))
      processed_text.push(this.provider.MathJax.tex2svg(part.math, {display: part.display}).outerHTML)

      last_index = part.end.n
    }

    if (last_index! < text.length)
      processed_text.push(text.slice(last_index))

    return processed_text.join("")
  }

  protected contains_tex_string(text: string): boolean {
    if (!this.provider.MathJax)
      return false

    return this.provider.MathJax.find_tex(text).length > 0
  };
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    default_size: p.Property<number>
  }
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends LayoutDOM {
  override properties: Widget.Props
  override __view_type__: WidgetView

  constructor(attrs?: Partial<Widget.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Widget.Props>(({Number}) => ({
      default_size: [ Number, 300 ],
    }))

    this.override<Widget.Props>({
      margin: [5, 5, 5, 5],
    })
  }
}
