import {logger} from "core/logging"
import type {DocJson, DocumentEvent} from "document"
import {Document} from "document"
import {Message} from "protocol/message"
import {Receiver} from "protocol/receiver"
import type {ErrorMsg} from "./session"
import {ClientSession} from "./session"

export const DEFAULT_SERVER_WEBSOCKET_URL = "ws://localhost:5006/ws"
export const DEFAULT_TOKEN = "eyJzZXNzaW9uX2lkIjogImRlZmF1bHQifQ"

let _connection_count: number = 0

export type Rejecter = (error: Error | string) => void
export type SessionResolver = (s: ClientSession) => void
export type MessageResolver = (m: Message<unknown>) => void
export type PendingReply = {resolve: MessageResolver, reject: Rejecter}

export type Token = {
  session_expiry: number
  session_id: string
  [key: string]: unknown
}

export function parse_token(token: string): Token {
  let payload = token.split(".")[0]
  const mod = payload.length % 4
  if (mod != 0) {
    payload = payload + "=".repeat(4-mod)
  }
  return JSON.parse(atob(payload.replace(/_/g, "/").replace(/-/g, "+")))
}

export class ClientConnection {
  protected readonly _number = _connection_count++

  socket: WebSocket | null = null
  session: ClientSession | null = null

  closed_permanently: boolean = false
  id: string

  protected _current_handler: ((message: Message<unknown>) => void) | null = null
  protected _pending_replies: Map<string, PendingReply> = new Map()
  protected _pending_messages: Message<unknown>[] = []
  protected readonly _receiver: Receiver = new Receiver()

  constructor(readonly url: string = DEFAULT_SERVER_WEBSOCKET_URL,
              readonly token: string = DEFAULT_TOKEN,
              readonly args_string: string | null = null) {
    this.id = parse_token(token).session_id.split(".")[0]
    logger.debug(`Creating websocket ${this._number} to '${this.url}' session '${this.id}'`)
  }

  async connect(): Promise<ClientSession> {
    if (this.closed_permanently) {
      throw new Error("Cannot connect() a closed ClientConnection")
    }
    if (this.socket != null) {
      throw new Error("Already connected")
    }

    this._current_handler = null
    this._pending_replies.clear()
    this._pending_messages = []

    try {
      let versioned_url = `${this.url}`
      if (this.args_string != null && this.args_string.length > 0) {
        versioned_url += `?${this.args_string}`
      }

      this.socket = new WebSocket(versioned_url, ["bokeh", this.token])

      return new Promise((resolve, reject) => {
        // "arraybuffer" gives us binary data we can look at;
        // if we just needed an opaque blob we could use "blob"
        this.socket!.binaryType = "arraybuffer"
        this.socket!.onopen = () => this._on_open(resolve, reject)
        this.socket!.onmessage = (event) => this._on_message(event)
        this.socket!.onclose = (event) => this._on_close(event, reject)
        this.socket!.onerror = () => this._on_error(reject)
      })
    } catch (error) {
      logger.error(`websocket creation failed to url: ${this.url}`)
      logger.error(` - ${error}`)
      throw error
    }
  }

  close(): void {
    if (!this.closed_permanently) {
      logger.debug(`Permanently closing websocket connection ${this._number}`)
      this.closed_permanently = true
      if (this.socket != null) {
        this.socket.close(1000, `close method called on ClientConnection ${this._number}`)
      }
      this.session!._connection_closed()
    }
  }

  protected _schedule_reconnect(milliseconds: number): void {
    const retry = () => {
      // TODO commented code below until we fix reconnection to repull
      // the document when required. Otherwise, we get a lot of
      // confusing errors that are causing trouble when debugging.
      /*
      if (this.closed_permanently) {
      */
      if (!this.closed_permanently) {
        logger.info(`Websocket connection ${this._number} disconnected, will not attempt to reconnect`)
        this.session?.notify_connection_lost()
      }
      return
      /*
      } else {
        logger.debug(`Attempting to reconnect websocket ${this._number}`)
        this.connect()
      }
      */
    }
    setTimeout(retry, milliseconds)
  }

  send(message: Message<unknown>): void {
    if (this.socket != null) {
      message.send(this.socket)
    } else {
      logger.error("not connected so cannot send", message)
    }
  }

  async send_with_reply<T>(message: Message<unknown>): Promise<Message<T>> {
    const reply = await new Promise<Message<unknown>>((resolve, reject) => {
      this._pending_replies.set(message.msgid(), {resolve, reject})
      this.send(message)
    })

    if (reply.msgtype() == "ERROR") {
      throw new Error(`Error reply ${(reply as ErrorMsg).content.text}`)
    } else {
      return reply as Message<T>
    }
  }

  protected async _pull_doc_json(): Promise<DocJson> {
    const message = Message.create("PULL-DOC-REQ", {}, {})
    const reply = await this.send_with_reply<{doc: DocJson}>(message)
    if (!("doc" in reply.content)) {
      throw new Error("No 'doc' field in PULL-DOC-REPLY")
    }
    return reply.content.doc
  }

  protected async _repull_session_doc(resolve: SessionResolver, reject: Rejecter): Promise<void> {
    logger.debug(this.session != null ? "Repulling session" : "Pulling session for first time")
    try {
      const doc_json = await this._pull_doc_json()
      if (this.session == null) {
        if (this.closed_permanently) {
          logger.debug("Got new document after connection was already closed")
          reject(new Error("The connection has been closed"))
        } else {
          const events: DocumentEvent[] = []
          const document = Document.from_json(doc_json, events)

          this.session = new ClientSession(this, document)

          // Send back change events that happened during model initialization.
          for (const event of events) {
            document._trigger_on_change(event)
          }

          for (const msg of this._pending_messages) {
            this.session.handle(msg)
          }
          this._pending_messages = []

          logger.debug("Created a new session from new pulled doc")
          resolve(this.session)
        }
      } else {
        this.session.document.replace_with_json(doc_json)
        logger.debug("Updated existing session with new pulled doc")
        // Since the session already exists, we don't need to call `resolve` again.
      }
    } catch (error) {
      console.trace(error)
      logger.error(`Failed to repull session ${error}`)
      reject(error instanceof Error ? error : `${error}`)
    }
  }

  protected _on_open(resolve: SessionResolver, reject: Rejecter): void {
    logger.info(`Websocket connection ${this._number} is now open`)
    this._current_handler = (message: Message<unknown>) => {
      this._awaiting_ack_handler(message, resolve, reject)
    }
  }

  protected _on_message(event: MessageEvent): void {
    if (this._current_handler == null) {
      logger.error("Got a message with no current handler set")
    }

    try {
      this._receiver.consume(event.data)
    } catch (e) {
      this._close_bad_protocol(`${e}`)
    }

    const msg = this._receiver.message
    if (msg != null) {
      const problem = msg.problem()
      if (problem != null) {
        this._close_bad_protocol(problem)
      }

      this._current_handler!(msg)
    }
  }

  protected _on_close(event: CloseEvent, reject: Rejecter): void {
    logger.info(`Lost websocket ${this._number} connection, ${event.code} (${event.reason})`)
    this.socket = null

    this._pending_replies.forEach((pr) => pr.reject("Disconnected"))
    this._pending_replies.clear()

    if (!this.closed_permanently) {
      this._schedule_reconnect(2000)
    }

    reject(new Error(`Lost websocket connection, ${event.code} (${event.reason})`))
  }

  protected _on_error(reject: Rejecter): void {
    logger.debug(`Websocket error on socket ${this._number}`)
    const msg = "Could not open websocket"
    logger.error(`Failed to connect to Bokeh server: ${msg}`)
    reject(new Error(msg))
  }

  protected _close_bad_protocol(detail: string): void {
    logger.error(`Closing connection: ${detail}`)
    if (this.socket != null) {
      this.socket.close(1002, detail)
    } // 1002 = protocol error
  }

  protected _awaiting_ack_handler(message: Message<unknown>, resolve: SessionResolver, reject: Rejecter): void {
    if (message.msgtype() === "ACK") {
      this._current_handler = (message) => this._steady_state_handler(message)

      // Reload any sessions
      void this._repull_session_doc(resolve, reject)
    } else {
      this._close_bad_protocol("First message was not an ACK")
    }
  }

  protected _steady_state_handler(message: Message<unknown>): void {
    const reqid = message.reqid()
    const pr = this._pending_replies.get(reqid)
    if (pr != null) {
      this._pending_replies.delete(reqid)
      pr.resolve(message)
    } else if (this.session != null) {
      this.session.handle(message)
    } else if (message.msgtype() != "PATCH-DOC") {
      // This branch can be executed only before we get the document.
      // When we get the document, all of the patches will already be incorporated.
      // In general, it's not possible to apply patches received before the document,
      // since they may change some models that were removed before serving the document.
      this._pending_messages.push(message)
    }
  }
}

export function pull_session(url?: string, token?: string, args_string?: string): Promise<ClientSession> {
  const connection = new ClientConnection(url, token, args_string)
  return connection.connect()
}
