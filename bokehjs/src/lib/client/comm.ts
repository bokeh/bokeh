import {logger} from "core/logging"
import type {Message} from "protocol/message"
import type {Rejecter} from "./connection"
import {ClientConnection} from "./connection"
import type {ClientSession, ErrorMsg} from "./session"

/**
 * A message channel to one Bokeh session hosted by a notebook kernel, for
 * example over a Jupyter comm. Each channel message carries one protocol
 * message as its envelope JSON and its binary buffers.
 */
export interface SessionChannel {
  /** Ask the kernel to connect to its session. The kernel answers with an ACK. */
  open(): void
  /** Send one protocol message. */
  send(envelope_json: string, buffers: ArrayBuffer[]): void
  /** Close the channel. */
  close(): void
  /** Set by the connection to receive protocol messages. */
  on_message: ((envelope_json: string, buffers: readonly (ArrayBuffer | ArrayBufferView)[]) => void) | null
  /** Set by the connection to learn that the kernel closed the channel. */
  on_close: (() => void) | null
}

/** An error the kernel reported for a message it received, e.g. a failed Python callback. */
export type SessionError = {text: string, traceback: string | null}

function session_token(session_id: string): string {
  return btoa(JSON.stringify({session_id})).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function array_buffer(buffer: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) {
    return buffer
  }
  const {byteOffset, byteLength} = buffer
  return buffer.buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer
}

/**
 * A client connection that exchanges Bokeh protocol messages over a
 * [[SessionChannel]] instead of a websocket. The session handshake, document
 * pulls, patches and replies are those of [[ClientConnection]]. A closed
 * channel is not reconnected, because the kernel discards its session.
 */
export class CommConnection extends ClientConnection {
  protected _opened: boolean = false
  protected _reject_connect: Rejecter | null = null

  constructor(readonly channel: SessionChannel, session_id: string,
              readonly on_error?: (error: SessionError) => void) {
    super("comm://", session_token(session_id))
  }

  override async connect(signal?: AbortSignal): Promise<ClientSession> {
    if (this.closed_permanently) {
      throw new Error("Cannot connect() a closed CommConnection")
    }
    if (this._opened) {
      throw new Error("Already connected")
    }
    signal?.throwIfAborted()
    this._opened = true

    const connected = new Promise<ClientSession>((resolve, reject) => {
      this._reject_connect = reject
      this._current_handler = (message) => this._awaiting_ack_handler(message, resolve, reject)
    })
    const on_abort = () => this.close()
    signal?.addEventListener("abort", on_abort, {once: true})
    this.channel.on_message = (envelope_json, buffers) => this._on_channel_message(envelope_json, buffers)
    this.channel.on_close = () => this._on_channel_close()
    try {
      this.channel.open()
      return await connected
    } finally {
      this._reject_connect = null
      signal?.removeEventListener("abort", on_abort)
    }
  }

  override close(): void {
    if (this.closed_permanently) {
      return
    }
    this._closed(new Error("The notebook session connection was closed"))
    try {
      this.channel.close()
    } catch (error) {
      logger.debug(`Could not close a notebook session channel: ${error}`)
    }
  }

  override send(message: Message<unknown>): boolean {
    if (this.closed_permanently || !this._opened) {
      logger.warn("not connected so cannot send", message)
      return false
    }
    const [envelope_json, buffers] = message.encode()
    this.channel.send(envelope_json, buffers)
    return true
  }

  protected _closed(reason: Error): void {
    this.closed_permanently = true
    this.channel.on_message = null
    this.channel.on_close = null
    this._reject_connect?.(reason)
    this._pending_replies.forEach((pending) => pending.reject(reason))
    this._pending_replies.clear()
    this.session?._connection_closed()
  }

  protected _on_channel_message(envelope_json: string, buffers: readonly (ArrayBuffer | ArrayBufferView)[]): void {
    let message: Message<unknown> | null
    try {
      this._receiver.consume(envelope_json)
      for (const buffer of buffers) {
        this._receiver.consume(array_buffer(buffer))
      }
      message = this._receiver.message
    } catch (error) {
      this._close_bad_protocol(`${error}`)
      return
    }
    if (message == null) {
      this._close_bad_protocol("a protocol message arrived without all of its buffers")
      return
    }
    this._current_handler?.(message)
  }

  protected _on_channel_close(): void {
    if (!this.closed_permanently) {
      logger.info("The kernel closed the notebook session connection")
      this._closed(new Error("The kernel closed the notebook session connection"))
    }
  }

  protected override _close_bad_protocol(detail: string): void {
    logger.error(`Closing connection: ${detail}`)
    this._reject_connect?.(new Error(detail))
    this.close()
  }

  protected override _steady_state_handler(message: Message<unknown>): void {
    const reqid = message.reqid()
    if (message.msgtype() == "ERROR" && (reqid == null || !this._pending_replies.has(reqid))) {
      this.on_error?.((message as ErrorMsg).content)
    }
    super._steady_state_handler(message)
  }
}

/** Options of [[pull_comm_session]]. */
export type CommSessionOptions = {
  /** The kernel's ID of the session, used to identify the connection. */
  session_id: string
  /** Closes the connection. */
  signal?: AbortSignal
  /** Called for errors the kernel reports for messages without a pending reply, such as patches. */
  on_error?(error: SessionError): void
}

/**
 * Connect to a session hosted by a notebook kernel and pull its document.
 *
 * @param channel the message channel to the kernel's session
 * @returns the client session, which owns the connection and the pulled document
 */
export async function pull_comm_session(channel: SessionChannel, options: CommSessionOptions): Promise<ClientSession> {
  const connection = new CommConnection(channel, options.session_id, options.on_error)
  try {
    return await connection.connect(options.signal)
  } catch (error) {
    connection.close()
    connection.session?.document.destroy()
    throw error
  }
}
