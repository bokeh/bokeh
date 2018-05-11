import {ClientSession} from "../client/session"
import {pull_session} from "../client/connection"
import {logger} from "../core/logging"
import {DOMView} from "../core/dom_view"

import {add_document_standalone, _create_view} from "./standalone"

// map { websocket url to map { session id to promise of ClientSession } }
const _sessions: {[key: string]: {[key: string]: Promise<ClientSession>}} = {}

function _get_session(websocket_url: string, session_id: string, args_string: string): Promise<ClientSession> {
  if (!(websocket_url in _sessions))
    _sessions[websocket_url] = {}

  const subsessions = _sessions[websocket_url]
  if (!(session_id in subsessions))
    subsessions[session_id] = pull_session(websocket_url, session_id, args_string)

  return subsessions[session_id]
}

// Fill element with the roots from session_id
export function add_document_from_session(element: HTMLElement,
    websocket_url: string, session_id: string, use_for_title: boolean): Promise<{[key: string]: DOMView}> {
  const args_string = window.location.search.substr(1)
  const promise = _get_session(websocket_url, session_id, args_string)
  return promise.then(
    (session: ClientSession) => {
      return add_document_standalone(session.document, element, use_for_title)
    },
    (error) => {
      logger.error(`Failed to load Bokeh session ${session_id}: ${error}`)
      throw error
    },
  )
}

// Replace element with a view of model_id from the given session
export function add_model_from_session(element: HTMLElement,
    websocket_url: string, model_id: string, session_id: string): Promise<DOMView> {
  const args_string = window.location.search.substr(1)
  const promise = _get_session(websocket_url, session_id, args_string)
  return promise.then(
    (session: ClientSession) => {
      const model = session.document.get_model_by_id(model_id)
      if (model == null)
        throw new Error(`Did not find model ${model_id} in session`)
      const view = _create_view(model)
      view.renderTo(element, true)
      return view
    },
    (error: Error) => {
      logger.error(`Failed to load Bokeh session ${session_id}: ${error}`)
      throw error
    },
  )
}
