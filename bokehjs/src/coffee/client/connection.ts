import {Promise} from "es6-promise"

import {logger} from "core/logging"
import {Document} from "document"
import {Message} from "protocol/message"
import {Receiver} from "protocol/receiver"
import {ClientSession} from "./session"

export const DEFAULT_SERVER_WEBSOCKET_URL = "ws://localhost:5006/ws"
export const DEFAULT_SESSION_ID = "default"

let _connection_count: number = 0

export type Rejecter = (error: Error | string) => void

export class ClientConnection {

  protected readonly _number = _connection_count++

  socket: WebSocket | null = null
  session: ClientSession | null = null

  closed_permanently: boolean = false

  protected _current_handler: ((message: Message) => void) | null = null
  protected _pending_ack: [(connection: ClientConnection) => void, Rejecter] | null = null // null or [resolve,reject]
  protected _pending_replies: {[key: string]: [(message: Message) => void, Rejecter]} = {} // map reqid to [resolve,reject]
  protected readonly _receiver: Receiver = new Receiver()

  constructor(readonly url: string = DEFAULT_SERVER_WEBSOCKET_URL,
              readonly id: string = DEFAULT_SESSION_ID,
              readonly args_string: string | null = null,
              protected _on_have_session_hook: ((session: ClientSession) => void) | null = null,
              protected _on_closed_permanently_hook: (() => void) | null = null) {

    logger.debug(`Creating websocket ${this._number} to '${this.url}' session '${this.id}'`)
  }

  connect(): Promise<ClientConnection> {
    if (this.closed_permanently)
      return Promise.reject(new Error("Cannot connect() a closed ClientConnection"))
    if (this.socket != null)
      return Promise.reject(new Error("Already connected"))

    this._pending_replies = {}
    this._current_handler = null

    try {
      let versioned_url = `${this.url}?bokeh-protocol-version=1.0&bokeh-session-id=${this.id}`
      if (this.args_string != null && this.args_string.length > 0)
        versioned_url += `&${this.args_string}`

      this.socket = new WebSocket(versioned_url)

      return new Promise((resolve, reject) => {
        // "arraybuffer" gives us binary data we can look at;
        // if we just needed an opaque blob we could use "blob"
        this.socket!.binaryType = "arraybuffer"
        this.socket!.onopen = () => this._on_open(resolve, reject)
        this.socket!.onmessage = (event) => this._on_message(event)
        this.socket!.onclose = (event) => this._on_close(event)
        this.socket!.onerror = () => this._on_error(reject)
      })
    } catch (error) {
      logger.error(`websocket creation failed to url: ${this.url}`)
      logger.error(` - ${error}`)
      return Promise.reject(error)
    }
  }

  close(): void {
    if (!this.closed_permanently) {
      logger.debug(`Permanently closing websocket connection ${this._number}`)
      this.closed_permanently = true
      if (this.socket != null)
        this.socket.close(1000, `close method called on ClientConnection ${this._number}`)
      this.session!._connection_closed()
      if (this._on_closed_permanently_hook != null) {
        this._on_closed_permanently_hook()
        this._on_closed_permanently_hook = null
      }
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
        if (!this.closed_permanently)
          logger.info(`Websocket connection ${this._number} disconnected, will not attempt to reconnect`)
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

  send(message: Message): void {
    if (this.socket == null)
      throw new Error(`not connected so cannot send ${message}`)
    message.send(this.socket)
  }

  send_with_reply(message: Message): Promise<Message> {
    const promise = new Promise((resolve, reject) => {
      this._pending_replies[message.msgid()] = [resolve, reject]
      this.send(message)
    })

    return promise.then(
      (message: Message) => {
        if (message.msgtype() === "ERROR")
          throw new Error(`Error reply ${message.content['text']}`)
        else
          return message
      },
      (error) => {
        throw error
      },
    )
  }

  protected _pull_doc_json(): Promise<Message> {
    const message = Message.create("PULL-DOC-REQ", {})
    const promise = this.send_with_reply(message)
    return promise.then(
      (reply) => {
        if (!('doc' in reply.content))
          throw new Error("No 'doc' field in PULL-DOC-REPLY")
        return reply.content['doc']
      },
      (error) => {
        throw error
      },
    )
  }

  protected _repull_session_doc(): void {
    if (this.session == null)
      logger.debug("Pulling session for first time")
    else
      logger.debug("Repulling session")
    this._pull_doc_json().then(
      (doc_json) => {
        if (this.session == null) {
          if (this.closed_permanently)
            logger.debug("Got new document after connection was already closed")
          else {
            const document = (Document as any).from_json(doc_json)

            // Constructing models changes some of their attributes, we deal with that
            // here. This happens when models set attributes during construction
            // or initialization.
            const patch = (Document as any)._compute_patch_since_json(doc_json, document)
            if (patch.events.length > 0) {
              logger.debug(`Sending ${patch.events.length} changes from model construction back to server`)
              const patch_message = Message.create('PATCH-DOC', {}, patch)
              this.send(patch_message)
            }

            this.session = new ClientSession(this, document, this.id)

            logger.debug("Created a new session from new pulled doc")
            if (this._on_have_session_hook != null) {
              this._on_have_session_hook(this.session)
              this._on_have_session_hook = null
            }
          }
        } else {
          this.session.document.replace_with_json(doc_json)
          logger.debug("Updated existing session with new pulled doc")
        }
      },
      (error) => {
        // handling the error here is useless because we wouldn't
        // get errors from the resolve handler above, so see
        // the catch below instead
        throw error
      },
    ).catch((error) => {
      if (console.trace != null)
        console.trace(error)
      logger.error(`Failed to repull session ${error}`)
    })
  }

  protected _on_open(resolve: (connection: ClientConnection) => void, reject: Rejecter): void {
    logger.info(`Websocket connection ${this._number} is now open`)
    this._pending_ack = [resolve, reject]
    this._current_handler = (message: Message) => {
      this._awaiting_ack_handler(message)
    }
  }

  protected _on_message(event: MessageEvent): void {
    if (this._current_handler == null)
      logger.error("Got a message with no current handler set")

    try {
      this._receiver.consume(event.data)
    } catch (e) {
      this._close_bad_protocol(e.toString())
    }

    if (this._receiver.message == null)
      return

    const msg = this._receiver.message

    const problem = msg.problem()
    if (problem != null)
      this._close_bad_protocol(problem)

    this._current_handler!(msg)
  }

  protected _on_close(event: CloseEvent): void {
    logger.info(`Lost websocket ${this._number} connection, ${event.code} (${event.reason})`)
    this.socket = null

    if (this._pending_ack != null) {
      this._pending_ack[1](new Error(`Lost websocket connection, ${event.code} (${event.reason})`))
      this._pending_ack = null
    }

    const pop_pending = () => {
      for (const reqid in this._pending_replies) {
        const promise_funcs = this._pending_replies[reqid]
        delete this._pending_replies[reqid]
        return promise_funcs
      }
      return null
    }
    let promise_funcs = pop_pending()
    while (promise_funcs != null) {
      promise_funcs[1]("Disconnected")
      promise_funcs = pop_pending()
    }
    if (!this.closed_permanently)
      this._schedule_reconnect(2000)
  }

  protected _on_error(reject: Rejecter): void {
    logger.debug(`Websocket error on socket ${this._number}`)
    reject(new Error("Could not open websocket"))
  }

  protected _close_bad_protocol(detail: string): void {
    logger.error(`Closing connection: ${detail}`)
    if (this.socket != null)
      this.socket.close(1002, detail) // 1002 = protocol error
  }

  protected _awaiting_ack_handler(message: Message): void {
    if (message.msgtype() === "ACK") {
      this._current_handler = (message: Message) => this._steady_state_handler(message)

      // Reload any sessions
      // TODO (havocp) there's a race where we might get a PATCH before
      // we send and get a reply to our pulls.
      this._repull_session_doc()

      if (this._pending_ack != null) {
        this._pending_ack[0](this)
        this._pending_ack = null
      }
    } else
      this._close_bad_protocol("First message was not an ACK")
  }

  protected _steady_state_handler(message: Message): void {
    if (message.reqid() in this._pending_replies) {
      const promise_funcs = this._pending_replies[message.reqid()]
      delete this._pending_replies[message.reqid()]
      promise_funcs[0](message)
    } else
      this.session!.handle(message)
  }
}

// Returns a promise of a ClientSession
// The returned promise has a close() method in case you want to close before
// getting a session; session.close() works too once you have a session.
export function pull_session(url: string, session_id: string, args_string?: string): Promise<ClientSession> {
  let connection: ClientConnection

  const promise = new Promise<ClientSession>((resolve, reject) => {
    connection = new ClientConnection(url, session_id, args_string,
      (session) => {
        try {
          resolve(session)
        } catch (error) {
          logger.error(`Promise handler threw an error, closing session ${error}`)
          session.close()
          throw error
        }
      },
      () => {
        // we rely on reject() as a no-op if we already resolved
        reject(new Error("Connection was closed before we successfully pulled a session"))
      },
    )
    return connection.connect().then(
      (_) => undefined,
      (error) => {
        logger.error(`Failed to connect to Bokeh server ${error}`)
        throw error
      },
    )
  })

  /*
  // add a "close" method to the promise... too weird?
  promise.close = () => {
    connection.close()
  }
  */
  return promise
}
