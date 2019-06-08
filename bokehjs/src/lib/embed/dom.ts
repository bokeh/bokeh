import {div, replaceWith} from "../core/dom"
import {RenderItem} from "./json"
import {bk_root} from "styles/root"

// Matches Bokeh CSS class selector. Setting all Bokeh parent element class names
// with this var prevents user configurations where css styling is unset.
export const BOKEH_ROOT = bk_root

function _get_element(elementid: string): HTMLElement {
  let element = document.getElementById(elementid)

  if (element == null)
    throw new Error(`Error rendering Bokeh model: could not find #${elementid} HTML tag`)
  if (!document.body.contains(element))
    throw new Error(`Error rendering Bokeh model: element #${elementid} must be under <body>`)

  // If autoload script, replace script tag with div for embedding.
  if (element.tagName == "SCRIPT") {
    const root_el = div({class: BOKEH_ROOT})
    replaceWith(element, root_el)
    element = root_el
  }

  return element
}

export function _resolve_element(item: RenderItem): HTMLElement {
  const {elementid} = item

  if (elementid != null)
    return _get_element(elementid)
  else
    return document.body
}

export function _resolve_root_elements(item: RenderItem): {[key: string]: HTMLElement} {
  const roots: {[key: string]: HTMLElement} = {}

  if (item.roots != null) {
    for (const root_id in item.roots)
      roots[root_id] = _get_element(item.roots[root_id])
  }

  return roots
}
