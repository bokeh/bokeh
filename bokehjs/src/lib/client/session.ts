import {Document, DocumentEvent, DocumentEventBatch} from "document"
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

  constructor(protected readonly _connection: ClientConnection, readonly document: Document, readonly id: string) {
    this.document.on_change(this._document_listener, true)
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

  close(): void {
    this._connection.close()
  }

  /*protected*/ _connection_closed(): void {
    this.document.remove_on_change(this._document_listener)
  }

  // Sends a request to the server for info about the server, such as its Bokeh
  // version. Returns a promise, the value of the promise is a free-form dictionary
  // of server details.
  async request_server_info(): Promise<unknown> {
    const message = Message.create("SERVER-INFO-REQ", {}, {})
    const reply = await this._connection.send_with_reply(message)
    return reply.content
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
    // Filter out events that were initiated by the ClientSession itself
    if ((event as any).setter_id === this.id) // XXX: not all document events define this
      return

    const events = event instanceof DocumentEventBatch ? event.events : [event]
    const patch = this.document.create_json_patch(events)

    // TODO (havocp) the connection may be closed here, which will
    // cause this send to throw an error - need to deal with it more cleanly.
    const message = Message.create("PATCH-DOC", {}, patch)
    this._connection.send(message)
  }

  protected _handle_patch(message: PatchMsg): void {
    this.document.apply_json_patch(message.content, message.buffers, this.id)
  }

  protected _handle_ok(message: OkMsg): void {
    logger.trace(`Unhandled OK reply to ${message.reqid()}`)
  }

  protected _handle_error(message: ErrorMsg): void {
    logger.error(`Unhandled ERROR reply to ${message.reqid()}: ${message.content.text}`)
  }
}
