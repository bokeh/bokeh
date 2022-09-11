import {Document, DocumentEvent, DocumentEventBatch} from "document"
import {Reconnected, Disconnected} from "core/bokeh_events"
import type {Patch} from "document"
import {Message} from "protocol/message"
import {ClientConnection} from "./connection"
import {logger} from "core/logging"

export type OkMsg = Message<{}>
export type ErrorMsg = Message<{text: string, traceback: string | null}>
export type PatchMsg = Message<Patch>

export class ClientSession {
  protected _document_listener = (event: DocumentEvent) => {
    this._document_changed(event)
  }

  constructor(protected readonly _connection: ClientConnection, readonly document: Document) {
    this.document.on_change(this._document_listener, true)
  }

  // XXX: this is only needed in tests
  get id(): string {
    return this._connection.id
  }

  handle(message: Message<unknown>): void {
    const msgtype = message.msgtype()

    switch (msgtype) {
      case "PATCH-DOC": {
        this._handle_patch(message as PatchMsg)
        break
      }
      case "OK": {
        this._handle_ok(message as OkMsg)
        break
      }
      case "ERROR": {
        this._handle_error(message as ErrorMsg)
        break
      }
      default:
        logger.debug(`Doing nothing with message '${msgtype}'`)
    }
  }

  notify_reconnected(): void {
    this.document.event_manager.send_event(new Reconnected())
  }

  notify_disconnected(): void {
    this.document.event_manager.send_event(new Disconnected())
  }

  close(): void {
    this._connection.close()
  }

  /*protected*/ _connection_closed(): void {
    this.document.remove_on_change(this._document_listener)
  }

  // Sends a request to the server for info about the server, such as its Bokeh
  // version. Returns a promise, the value of the promise is a free-form dictionary
  // of server details.
  async request_server_info(): Promise<{version_info: string}> {
    const message = Message.create("SERVER-INFO-REQ", {}, {})
    const reply = await this._connection.send_with_reply(message)
    return reply.content as {version_info: string}
  }

  // Sends some request to the server (no guarantee about which one) and returns
  // a promise which is completed when the server replies. The purpose of this
  // is that if you wait for the promise to be completed, you know the server
  // has processed the request. This is useful when writing tests because once
  // the server has processed this request it should also have processed any
  // events or requests you sent previously, which means you can check for the
  // results of that processing without a race condition. (This assumes the
  // server processes events in sequence, which it mostly has to semantically,
  // since reordering events might change the final state.)
  async force_roundtrip(): Promise<void> {
    await this.request_server_info()
  }

  protected _document_changed(event: DocumentEvent): void {
    const events = event instanceof DocumentEventBatch ? event.events : [event]
    const patch = this.document.create_json_patch(events)

    // TODO (havocp) the connection may be closed here, which will
    // cause this send to throw an error - need to deal with it more cleanly.
    const message = Message.create("PATCH-DOC", {}, patch)
    this._connection.send(message)
  }

  protected _handle_patch(message: PatchMsg): void {
    this.document.apply_json_patch(message.content, message.buffers)
  }

  protected _handle_ok(message: OkMsg): void {
    logger.trace(`Unhandled OK reply to ${message.reqid()}`)
  }

  protected _handle_error(message: ErrorMsg): void {
    logger.error(`Unhandled ERROR reply to ${message.reqid()}: ${message.content.text}`)
  }
}
