import {Document} from "../document"
import {logger} from "../core/logging"
import {defer} from "../core/util/callback"
import {unescape} from "../core/util/string"
import {isString} from "../core/util/types"

import {add_model_standalone, add_document_standalone} from "./standalone"
import {add_model_from_session, add_document_from_session} from "./server"
import {_get_element} from "./dom"
import {DocsJson, RenderItem} from "./json"

export * from "./json"
export * from "./standalone"
export * from "./server"
export * from "./notebook"
export {BOKEH_ROOT, inject_css, inject_raw_css} from "./dom"

export function _get_ws_url(app_path: string | undefined, absolute_url: string | undefined): string {
  let protocol = 'ws:'
  if (window.location.protocol == 'https:')
    protocol = 'wss:'

  let loc: HTMLAnchorElement | Location
  if (absolute_url != null) {
    loc = document.createElement('a')
    loc.href = absolute_url
  } else
    loc = window.location

  if (app_path != null) {
    if (app_path == "/")
      app_path = ""
  } else
    app_path = loc.pathname.replace(/\/+$/, '')

  return protocol + '//' + loc.host + app_path + '/ws'
}

// TODO (bev) this is currently clunky. Standalone embeds only provide
// the first two args, whereas server provide the app_app, and *may* prove and
// absolute_url as well if non-relative links are needed for resources. This function
// should probably be split in to two pieces to reflect the different usage patterns
export function embed_items(docs_json: string | DocsJson, render_items: RenderItem[], app_path?: string, absolute_url?: string): void {
  defer(() => _embed_items(docs_json, render_items, app_path, absolute_url))
}

function _embed_items(docs_json: string | DocsJson, render_items: RenderItem[], app_path?: string, absolute_url?: string): void {
  if (isString(docs_json))
    docs_json = JSON.parse(unescape(docs_json)) as DocsJson

  const docs: {[key: string]: Document} = {}
  for (const docid in docs_json) {
    const doc_json = docs_json[docid]
    docs[docid] = Document.from_json(doc_json)
  }

  for (const item of render_items) {
    const elem = _get_element(item)
    const use_for_title = item.use_for_title != null && item.use_for_title

    // handle server session cases
    if (item.sessionid != null) {
      const websocket_url = _get_ws_url(app_path, absolute_url)
      logger.debug(`embed: computed ws url: ${websocket_url}`)
      let promise: Promise<any>
      if (item.modelid != null)
        promise = add_model_from_session(elem, websocket_url, item.modelid, item.sessionid)
      else
        promise = add_document_from_session(elem, websocket_url, item.sessionid, item.roots, use_for_title)

      promise.then(
        () => {
          console.log("Bokeh items were rendered successfully")
        },
        (error: Error) => {
          console.log("Error rendering Bokeh items ", error)
        },
      )

    // handle standalone document cases
    } else if (item.docid != null) {
      if (item.modelid != null)
        add_model_standalone(item.modelid, elem, docs[item.docid])
      else
        add_document_standalone(docs[item.docid], elem, item.roots, use_for_title)
    } else
       throw new Error(`Error rendering Bokeh items to element ${item.elementid}: no document ID or session ID specified`)
  }
}
