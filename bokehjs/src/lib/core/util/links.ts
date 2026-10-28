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

const handled_fragment_events = new WeakSet<Event>()

export function scroll_to_fragment(root: ShadowRoot, event?: HashChangeEvent): void {
  if (event != null && handled_fragment_events.has(event)) {
    return
  }
  const fragment = window.location.hash.slice(1)
  if (fragment.length == 0) {
    return
  }
  let name: string
  try {
    name = decodeURIComponent(fragment)
  } catch {
    name = fragment
  }
  const target = deep_fragment_target(root, name) ?? deep_fragment_target(root, fragment)
  const document_target = deep_fragment_target(document, name) ?? deep_fragment_target(document, fragment)
  // Unscoped URLs follow document order, as ordinary duplicate IDs do.
  if (target != null && (document_target == null || document_target == target)) {
    if (event != null) {
      handled_fragment_events.add(event)
    }
    target.scrollIntoView()
  }
}

export function follow_fragment_link(event: MouseEvent, root: ShadowRoot): void {
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
  const target = deep_fragment_target(root, name) ?? deep_fragment_target(root, href.slice(1)) ?? deep_fragment_target(document, name)
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
      const event = new HashChangeEvent("hashchange", {oldURL: old_url, newURL: new_url})
      // The originating link has already scrolled its own target. Passive
      // listeners must not redirect this navigation to another shadow root.
      handled_fragment_events.add(event)
      setTimeout(() => window.dispatchEvent(event))
    }
  }
}
