import {DocumentEventBatch, ModelChangedEvent} from "document"
import type {Patch, Document, DocumentEvent, DocumentChangedEvent, SyncFlush} from "document"
import {Message} from "protocol/message"
import {Model} from "model"
import type {ClientConnection} from "./connection"
import {logger} from "core/logging"
import {dict} from "core/util/object"
import {SyncPolicyQueue} from "core/util/sync_policy"
import type {SyncPolicyKind} from "core/util/sync_policy"

export type OkMsg = Message<void>
export type ErrorMsg = Message<{text: string, traceback: string | null}>
export type PatchMsg = Message<Patch>

type SessionSyncQueueKey = readonly [
  model_id: string,
  attr: string,
  kind: SyncPolicyKind,
  wait: number | null,
]

export class ClientSession {
  protected readonly _sync_queue: SyncPolicyQueue<ModelChangedEvent, SessionSyncQueueKey>

  protected _document_listener = (event: DocumentEvent) => {
    this._document_changed(event)
  }

  protected _sync_flush_listener = ({model, attr, policy}: SyncFlush) => {
    const prefix = policy == null ? [model.id, attr] : [model.id, attr, policy]
    this._sync_queue.flush(prefix)
  }

  constructor(protected readonly _connection: ClientConnection, readonly document: Document) {
    this._sync_queue = new SyncPolicyQueue((event) => {
      if (event.model instanceof Model && event.model.document == this.document) {
        this._send_patch([event])
      }
    })
    this.document.on_change(this._document_listener, true)
    this.document.sync_flush.connect(this._sync_flush_listener)
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
    const events = this._sync_queue.drain().filter((event) => {
      return event.model instanceof Model && event.model.document == this.document
    })
    this._send_patch(events)
    this._connection.close()
  }

  /*protected*/ _connection_closed(): void {
    this.document.remove_on_change(this._document_listener)
    this.document.sync_flush.disconnect(this._sync_flush_listener)
    this._sync_queue.cancel()
  }

  // Waits for the server to process all preceding messages. This is useful in
  // tests that need to observe the result of an asynchronously sent patch.
  async force_roundtrip(): Promise<void> {
    const message = Message.create("SYNC", {})
    await this._connection.send_with_reply(message)
  }

  protected _document_changed(event: DocumentEvent): void {
    const events: DocumentChangedEvent[] = event instanceof DocumentEventBatch ? event.events : [event]
    const batch_sync = event.sync

    const immediate: DocumentChangedEvent[] = []
    for (const event of events) {
      if (event instanceof ModelChangedEvent && event.model instanceof Model && event.attr == "_subscribed_changes") {
        this._flush_changed_callback_policies(event.model)
      }

      if (!batch_sync || !event.sync) {
        this._cancel_superseded_sync(event)
        continue
      }

      if (event instanceof ModelChangedEvent && event.model instanceof Model) {
        const policies = dict(event.model._subscribed_changes).get(event.attr)
        if (policies != null) {
          for (const policy of policies) {
            const [kind, wait] = policy
            const tagged = new ModelChangedEvent(
              event.document, event.model, event.attr, event.value, policy,
            )
            tagged.sync = event.sync
            if (kind == "immediate") {
              immediate.push(tagged)
            } else {
              const key: SessionSyncQueueKey = [event.model.id, event.attr, kind, wait]
              const delivered = this._sync_queue.submit(
                key, policy, tagged, this.document.is_sync_deferred(event.model, event.attr),
              )
              if (delivered != null) {
                immediate.push(delivered)
              }
            }
          }
          continue
        }
      }

      this._cancel_superseded_sync(event)
      immediate.push(event)
    }

    this._send_patch(immediate)
  }

  protected _flush_changed_callback_policies(model: Model): void {
    const subscribed = dict(model._subscribed_changes)
    for (const key of this._sync_queue.keys()) {
      const [model_id, attr, kind, wait] = key
      if (model_id == model.id) {
        const policies = subscribed.get(attr) ?? []
        if (!policies.some(([policy_kind, policy_wait]) => policy_kind == kind && policy_wait == wait)) {
          this._sync_queue.flush(key)
        }
      }
    }
  }

  protected _cancel_sync(model: Model, attr: string): void {
    this._sync_queue.cancel([model.id, attr])
  }

  protected _cancel_superseded_sync(event: DocumentChangedEvent): void {
    if (!(event instanceof ModelChangedEvent) || !(event.model instanceof Model)) {
      return
    }
    this._cancel_sync(event.model, event.attr)
  }

  protected _send_patch(events: DocumentChangedEvent[]): void {
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
