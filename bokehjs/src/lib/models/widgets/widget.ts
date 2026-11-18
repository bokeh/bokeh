import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {toggle_attribute} from "core/dom"
import type {MathJaxProvider} from "models/text/providers"
import {default_provider} from "models/text/providers"

import type * as p from "core/properties"

export abstract class WidgetView extends LayoutDOMView {
  declare model: Widget

  protected *disabled_controls(): Iterable<HTMLElement & {disabled: boolean}> {}

  override initialize(): void {
    super.initialize()

    if (this.provider.is_pending) {
      // `ready` is emitted when done, see connect_signals()
      this.schedule(async () => await this.provider.load())
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.provider.ready, () => this._after_mathjax_load())
    this.connect(this.disabled, (disabled) => {
      for (const el of this.disabled_controls()) {
        toggle_attribute(el, "disabled", disabled)
      }
    })
  }

  get child_models(): LayoutDOM[] {
    return []
  }

  get provider(): MathJaxProvider {
    return default_provider
  }

  /**
   * Called when loading MathJax finished, whether it succeeded or failed.
   * Views that render TeX should re-render here, if they were rendered already.
   */
  protected _after_mathjax_load(): void {
    this.notify_finished()
  }

  override has_finished(): boolean {
    return super.has_finished() && this.provider.status != "loading"
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
  }
}

export namespace Widget {
  export type Attrs = p.AttrsOf<Props>
  export type Props = LayoutDOM.Props
}

export interface Widget extends Widget.Attrs {}

export abstract class Widget extends LayoutDOM {
  declare properties: Widget.Props
  declare __view_type__: WidgetView

  static {
    this.override<Widget.Props>({
      margin: 5,
    })
  }
}
