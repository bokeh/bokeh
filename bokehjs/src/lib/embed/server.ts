import type {ClientSession} from "../client/session"
import {parse_token, pull_session} from "../client/connection"
import {logger} from "../core/logging"
import type {ViewManager} from "../core/view_manager"

import {add_document_standalone} from "./standalone"
import type {EmbedTarget} from "./dom"

// @internal
export function _get_ws_url(app_path: string | undefined, absolute_url: string | undefined): string {
  // if in an `srcdoc` iframe, try to get the absolute URL
  // from the `data-absolute-url` attribute if not passed explicitly
  if (absolute_url === undefined && _is_frame_HTMLElement(frameElement) && frameElement.dataset.absoluteUrl !== undefined) {
    absolute_url = frameElement.dataset.absoluteUrl
  }

  let loc: HTMLAnchorElement | Location
  if (absolute_url != null) {
    loc = document.createElement("a")
    loc.href = absolute_url
  } else {
    loc = window.location
  }

  const protocol = loc.protocol == "https:" ? "wss:" : "ws:"
  if (app_path != null) {
    if (app_path == "/") {
      app_path = ""
    }
  } else {
    app_path = loc.pathname.replace(/\/+$/, "")
  }

  return `${protocol}//${loc.host}${app_path}/ws`
}

function _is_frame_HTMLElement(frame: Element | null): frame is HTMLIFrameElement {
  // `frameElement` is a delicate construct; it allows the document inside the frame to access
  // some (but not all) properties of the parent element in which the frame document is embedded.
  // Because it lives in a different DOM context than the frame's `window`, we cannot just use
  // `frameElement instanceof HTMLIFrameElement`; we could use `window.parent.HTMLIFrameElement`
  // but this can be blocked by CORS policy and throw an exception.
  if (frame === null) {
    return false
  }
  if (frame.tagName.toUpperCase() === "IFRAME") {
    return true
  }
  return false
}

type WebSocketURL = string
type SessionID = string

const _sessions: Map<WebSocketURL, Map<SessionID, Promise<ClientSession>>> = new Map()

function _get_session(websocket_url: string, token: string, args_string: string): Promise<ClientSession> {
  const session_id = parse_token(token).session_id
  if (!_sessions.has(websocket_url)) {
    _sessions.set(websocket_url, new Map())
  }

  const subsessions = _sessions.get(websocket_url)!
  if (!subsessions.has(session_id)) {
    subsessions.set(session_id, pull_session(websocket_url, token, args_string))
  }

  return subsessions.get(session_id)!
}

// Fill element with the roots from token
export async function add_document_from_session(websocket_url: string, token: string, element: EmbedTarget,
    roots: EmbedTarget[] = [], use_for_title: boolean = false): Promise<ViewManager> {
  const args_string = window.location.search.substring(1)
  let session: ClientSession
  try {
    session = await _get_session(websocket_url, token, args_string)
  } catch (error) {
    const session_id = parse_token(token).session_id
    logger.error(`Failed to load Bokeh session ${session_id}: ${error}`)
    throw error
  }
  return add_document_standalone(session.document, element, roots, use_for_title)
}
