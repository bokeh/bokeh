import {Markup, MarkupView} from "./markup"
import type * as p from "core/properties"

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

/**
 * Whether following `anchor` navigates the current browsing context. Like browsers,
 * this uses the `target` of the document's `<base>` if `anchor` has no `target`.
 */
function navigates_self(anchor: HTMLAnchorElement): boolean {
  const target = (() => {
    if (anchor.hasAttribute("target")) {
      return anchor.target
    }
    const base = anchor.ownerDocument.querySelector<HTMLBaseElement>("base[target]")
    return base?.target ?? ""
  })()
  return target == "" || target == "_self"
}

function without_fragment(url: string): string {
  const result = new URL(url)
  result.hash = ""
  return result.href
}

export class DivView extends MarkupView {
  declare model: Div

  override connect_signals(): void {
    super.connect_signals()
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
    if (anchor == null || anchor.hasAttribute("download") || !navigates_self(anchor)) {
      return
    }
    const href = anchor.getAttribute("href")
    if (href == null || !href.startsWith("#") || href.length == 1) {
      return
    }
    // With `<base href>`, the link may point to another document.
    const old_url = window.location.href
    const new_url = anchor.href
    if (without_fragment(new_url) != without_fragment(old_url)) {
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
      // The browser would scroll again after this (to the top of the page for `#top`), so
      // follow the link ourselves: update the URL and history, and fire the same events.
      event.preventDefault()
      if (new_url != old_url) {
        window.history.pushState(null, "", new_url)
      }
      window.dispatchEvent(new PopStateEvent("popstate", {state: window.history.state}))
      target.scrollIntoView()
      if (new_url != old_url) {
        setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange", {oldURL: old_url, newURL: new_url})))
      }
    }
  }

  override render(): void {
    super.render()
    if (this.model.render_as_text) {
      this.markup_el.textContent = this.model.text
    } else {
      this.markup_el.innerHTML = this.has_math_disabled() ? this.model.text : this.process_tex(this.model.text)
    }
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

  constructor(attrs?: Partial<Div.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DivView

    this.define<Div.Props>(({Bool}) => ({
      render_as_text: [ Bool, false ],
    }))
  }
}
