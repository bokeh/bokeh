import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"
import {UIComponent} from "core/vdom"
import type {VNode} from "core/vdom"

import * as markup_css from "styles/widgets/markup.css"

/**
 * Finds the target of a fragment link (`#name`) in `root`: an element whose `id`
 * is `name`, or else an `<a>` element whose `name` is `name`, as browsers do.
 */
function fragment_target(root: Document | ShadowRoot, name: string): Element | null {
  return root.getElementById(name) ?? root.querySelector(`a[name="${CSS.escape(name)}"]`)
}

/**
 * Like `fragment_target()`, but also searches every open shadow root nested in `root`.
 */
function deep_fragment_target(root: Document | ShadowRoot, name: string): Element | null {
  const target = fragment_target(root, name)
  if (target != null) {
    return target
  }
  for (const el of root.querySelectorAll("*")) {
    if (el.shadowRoot != null) {
      const target = deep_fragment_target(el.shadowRoot, name)
      if (target != null) {
        return target
      }
    }
  }
  return null
}

export class DivView extends MarkupView {
  declare readonly model: Div
  declare readonly signals: p.SignalsOf<Div.Props>

  override initialize(): void {
    super.initialize()
    // The text is rendered in a shadow root, so the browser can't find the targets
    // of fragment links (`<a href="#name">`) in it, nor in any other component.
    this.shadow_el.addEventListener("click", (event) => {
      if (event instanceof MouseEvent) {
        this._follow_fragment_link(event)
      }
    })
  }

  protected _follow_fragment_link(event: MouseEvent): void {
    if (event.defaultPrevented || event.button != 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }
    const anchor = event.composedPath().find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement)
    if (anchor == null || (anchor.target != "" && anchor.target != "_self")) {
      return
    }
    const href = anchor.getAttribute("href")
    if (href == null || !href.startsWith("#") || href.length == 1) {
      return
    }
    const name = (() => {
      try {
        return decodeURIComponent(href.slice(1))
      } catch {
        return href.slice(1)
      }
    })()
    // The browser finds targets that are in the document itself.
    if (fragment_target(document, name) != null) {
      return
    }
    // Prefer a target in this component's own text.
    const target = deep_fragment_target(this.shadow_el, name) ?? deep_fragment_target(document, name)
    if (target != null) {
      // Don't prevent the default action, so the browser still updates the URL and history.
      target.scrollIntoView()
    }
  }

  override component(): VNode {
    const {text, render_as_text} = this.signals

    const markup = (() => {
      if (render_as_text.value) {
        return <div class={markup_css.markup}>{text}</div>
      } else {
        const {value} = text
        const set_html = (el: HTMLElement | null): void => {
          if (el != null) {
            el.innerHTML = this.has_math_disabled() ? value : this.process_tex(value)
          }
        }
        return <div class={markup_css.markup} ref={set_html}></div>
      }
    })()

    return <UIComponent parent={this.resolved_props}>{markup}</UIComponent>
  }
}

export namespace Div {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props & {
    render_as_text: p.Property<boolean>
  }
}

export interface Div extends Div.Attrs {}

export class Div extends Markup {
  declare properties: Div.Props
  declare __view_type__: DivView

  static {
    this.prototype.default_view = DivView

    this.define<Div.Props>(({Bool}) => ({
      render_as_text: [ Bool, false ],
    }))
  }
}
