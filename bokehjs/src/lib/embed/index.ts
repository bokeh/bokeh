import {Document, DocJson} from "../document"
import {logger} from "../core/logging"
import {defer} from "../core/util/callback"
import {unescape, uuid4} from "../core/util/string"
import {isString} from "../core/util/types"

import {DocsJson, RenderItem} from "./json"
import {add_document_standalone} from "./standalone"
import {add_document_from_session, _get_ws_url} from "./server"
import {_resolve_element, _resolve_root_elements} from "./dom"

export {DocsJson, RenderItem} from "./json"
export {add_document_standalone} from "./standalone"
export {add_document_from_session} from "./server"
export {embed_items_notebook, kernels} from "./notebook"
export {BOKEH_ROOT, inject_css, inject_raw_css} from "./dom"

export type JsonItem = {doc: DocJson, root_id: string, target_id: string}
interface Roots {[index: string]: string}

export function embed_item(item: JsonItem, target_id?: string) {
  const docs_json: DocsJson = {}
  const doc_id = uuid4()
  docs_json[doc_id] = item.doc

  if (target_id == null)
    target_id = item.target_id
  const roots: Roots = {[item.root_id]: target_id}
  const render_item: RenderItem = { roots: roots, docid: doc_id }

  defer(() => _embed_items(docs_json, [render_item]))
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
    const element = _resolve_element(item)
    const roots = _resolve_root_elements(item)

    if (item.docid != null) {
      add_document_standalone(docs[item.docid], element, roots, item.use_for_title)
    } else if (item.sessionid != null) {
      const websocket_url = _get_ws_url(app_path, absolute_url)
      logger.debug(`embed: computed ws url: ${websocket_url}`)

      const promise = add_document_from_session(websocket_url, item.sessionid, element, roots, item.use_for_title)
      promise.then(
        () => {
          console.log("Bokeh items were rendered successfully")
        },
        (error) => {
          console.log("Error rendering Bokeh items:", error)
        },
      )
    } else
      throw new Error(`Error rendering Bokeh items: either 'docid' or 'sessionid' was expected.`)
  }
}
