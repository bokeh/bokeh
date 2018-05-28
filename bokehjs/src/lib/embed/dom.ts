import {div, link, style/*, replaceWith*/} from "../core/dom"
//import {logger, set_log_level} from "../core/logging"
import {RenderItem} from "./json"

// Matches Bokeh CSS class selector. Setting all Bokeh parent element class names
// with this var prevents user configurations where css styling is unset.
export const BOKEH_ROOT = "bk-root"

export function inject_css(url: string): void {
  const element = link({href: url, rel: "stylesheet", type: "text/css"})
  document.body.appendChild(element)
}

export function inject_raw_css(css: string): void {
  const element = style({}, css)
  document.body.appendChild(element)
}

/*
// pull missing render item fields from data- attributes
function _fill_render_item_from_script_tag(script: HTMLElement, item: RenderItem): void {
  const {bokehLogLevel, bokehDocId, bokehModelId, bokehSessionId} = script.dataset

  // length checks are because we put all the attributes on the tag
  // but sometimes set them to empty string
  if (bokehLogLevel != null && bokehLogLevel.length > 0)
    set_log_level(bokehLogLevel)
  if (bokehDocId != null && bokehDocId.length > 0)
    item.docid = bokehDocId
  if (bokehModelId != null && bokehModelId.length > 0)
    item.modelid = bokehModelId
  if (bokehSessionId != null && bokehSessionId.length > 0)
    item.sessionid = bokehSessionId

  logger.info(`Will inject Bokeh script tag with params ${JSON.stringify(item)}`)
}
*/

export function _get_element(item: RenderItem, root_id?: string): HTMLElement {
  const elem = (item.elementid != null && document.getElementById(item.elementid)) || document.body

  if (root_id != null) {
    if (item.roots != null && root_id in item.roots) {
      const root_el = document.getElementById(item.roots[root_id])
      if (root_el != null)
        return root_el
    }

    if (elem.classList.contains(BOKEH_ROOT))
      return elem
    else {
      const root_el = div({class: BOKEH_ROOT})
      elem.appendChild(root_el)
      return root_el
    }
  }

  /*
  if (elem == null)
    throw new Error(`Error rendering Bokeh model: could not find tag with id: ${elementid}`)
  if (!document.body.contains(elem))
    throw new Error(`Error rendering Bokeh model: element with id '${elementid}' must be under <body>`)

  // if autoload script, replace script tag with div for embedding
  if (elem.tagName == "SCRIPT") {
    _fill_render_item_from_script_tag(elem, item)
    const container = div({class: BOKEH_ROOT})
    replaceWith(elem, container)
    const child = div()
    container.appendChild(child)
    elem = child
  }
  */

  return elem
}
