import type {Keys} from "../dom"
import {InlineStyleSheet} from "../dom"
import type {StyleSheet} from "../stylesheets"
import {ShadowComponent} from "../vdom"

import type {VNode, ComponentChildren, JSX} from "preact"
import {useEffect, useRef} from "preact/hooks"

import panes_css from "styles/panes.css"
import vars_css from "styles/vars.css"
import core_css from "styles/core.css"

const base_stylesheets: StyleSheet[] = [vars_css, core_css, panes_css].map((css) => new InlineStyleSheet(css))

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
   * Additional stylesheets for pane's contents.
   */
  stylesheets?: StyleSheet[]
  class?: string
  style?: JSX.CSSProperties
  children?: ComponentChildren
}

/**
 * A pane that drops down below its anchor, i.e. the nearest positioned ancestor
 * (see `styles/panes.less`). Pane's contents are rendered in a shadow root.
 */
export function DropPane(props: DropPaneProps): VNode {
  const {open, stylesheets=[], children} = props

  // Keep the latest props, so that listeners don't have to be reattached on each render.
  const props_ref = useRef(props)
  props_ref.current = props

  const el_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

  // Inline style, because it has to take precedence over `:host` rules (e.g. `display: grid`).
  const style = {...props.style, display: open ? undefined : "none"}

  return (
    // `display: contents`, so that the host of the shadow root is positioned relative to pane's anchor
    <div ref={el_ref} style={{display: "contents"}}>
      <ShadowComponent class={props.class} style={style} stylesheets={[...base_stylesheets, ...stylesheets]}>
        {children}
      </ShadowComponent>
    </div>
  )
}
