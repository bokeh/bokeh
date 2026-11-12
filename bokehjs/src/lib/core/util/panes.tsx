import type {Keys} from "../dom"

import type {VNode, ComponentChildren, JSX} from "preact"
import {useLayoutEffect, useRef} from "preact/hooks"

export type DropPaneProps = {
  /**
   * Whether the pane is shown. A closed pane is hidden, but its contents
   * stay mounted, so that opening and closing it doesn't rebuild them.
   */
  open: boolean
  /**
   * Called when the user dismisses the pane, i.e. on a mouse press outside
   * of the pane (and `ignore`), when pressing `Escape` or when the window
   * loses focus. The owner is expected to close the pane in response.
   */
  on_dismiss: () => void
  /**
   * An element (e.g. pane's toggle) or a predicate, which prevent
   * dismissal of the pane on mouse presses.
   */
  ignore?: Element | ((event: UIEvent) => boolean)
  /**
   * CSS classes of the pane, which determine its appearance and position
   * (e.g. `.bk-drop-pane` from `styles/panes.css`). The pane is rendered in
   * its owner's DOM, so the owner has to provide the relevant stylesheets.
   */
  class?: string
  style?: JSX.CSSProperties
  children?: ComponentChildren
}

/**
 * A pane (e.g. a menu) that can be dismissed by the user. This manages
 * visibility and dismissal of the pane, but not its appearance.
 */
export function DropPane(props: DropPaneProps): VNode {
  const {open, children} = props

  // Keep the latest props, so that listeners don't have to be reattached on each render.
  const props_ref = useRef(props)
  props_ref.current = props

  const el_ref = useRef<HTMLDivElement>(null)

  // A layout effect, so that listeners are attached as soon as the pane is shown.
  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const is_ignored = (event: UIEvent): boolean => {
      const path = event.composedPath()
      const {current: el} = el_ref
      if (el != null && path.includes(el)) {
        return true
      }
      const {ignore} = props_ref.current
      if (ignore instanceof Element) {
        return path.includes(ignore)
      } else if (ignore != null) {
        return ignore(event)
      } else {
        return false
      }
    }

    const dismiss = () => props_ref.current.on_dismiss()

    const on_mousedown = (event: MouseEvent) => {
      if (!is_ignored(event)) {
        dismiss()
      }
    }
    const on_keydown = (event: KeyboardEvent) => {
      if ((event.key as Keys) == "Escape") {
        dismiss()
      }
    }

    const controller = new AbortController()
    const {signal} = controller
    document.addEventListener("mousedown", on_mousedown, {signal})
    document.addEventListener("keydown", on_keydown, {signal})
    window.addEventListener("blur", dismiss, {signal})
    return () => controller.abort()
  }, [open])

  const style = {...props.style, display: open ? undefined : "none"}

  return (
    <div ref={el_ref} class={props.class} style={style}>
      {children}
    </div>
  )
}
