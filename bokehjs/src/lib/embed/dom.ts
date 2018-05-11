import {div, link, style, replaceWith} from "../core/dom"
import {logger, set_log_level} from "../core/logging"
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

export function _get_element(item: RenderItem): HTMLElement {
  const element_id = item.elementid
  let elem = document.getElementById(element_id)

  if (elem == null)
    throw new Error(`Error rendering Bokeh model: could not find tag with id: ${element_id}`)
  if (!document.body.contains(elem))
    throw new Error(`Error rendering Bokeh model: element with id '${element_id}' must be under <body>`)

  // if autoload script, replace script tag with div for embedding
  if (elem.tagName == "SCRIPT") {
    _fill_render_item_from_script_tag(elem, item)
    const container = div({class: BOKEH_ROOT})
    replaceWith(elem, container)
    const child = div()
    container.appendChild(child)
    elem = child
  }

  return elem
}
