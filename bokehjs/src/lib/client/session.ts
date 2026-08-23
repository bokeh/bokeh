import {DocumentEventBatch} from "document"
import type {DocumentChangedEvent} from "document"
import type {Patch, Document, DocumentEvent} from "document"
import {Message} from "protocol/message"
import type {ClientConnection} from "./connection"
import {logger} from "core/logging"

export type OkMsg = Message<void>
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

  // TODO: notify_connection_retry ?
  // data: time (ms) to next retry, connection attempt number

  close(): void {
    this._connection.close()
  }

  /*protected*/ _connection_closed(): void {
    this.document.remove_on_change(this._document_listener)
  }

  // Waits for the server to process all preceding messages. This is useful in
  // tests that need to observe the result of an asynchronously sent patch.
  async force_roundtrip(): Promise<void> {
    const message = Message.create("SYNC", {})
    await this._connection.send_with_reply(message)
  }

  protected _document_changed(event: DocumentEvent): void {
    const events = (() => {
      const events: DocumentChangedEvent[] = event instanceof DocumentEventBatch ? (event.sync ? event.events : []) : [event]
      return events.filter((event) => event.sync)
    })()

    if (events.length == 0) {
      return
    }

    const patch = this.document.create_json_patch(events)

    const message = Message.create("PATCH-DOC", patch)
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
