import type {Document, Patch} from "document"
import type {ID} from "core/types"
import {Buffer} from "core/serialization/buffer"
import {unique_id} from "core/util/string"
import {ClientSession} from "client/session"
import type {SessionConnection} from "client/session"

export type NotebookPatch = {
  /** Discriminator for incremental document updates. */
  kind: "patch"
  /**
   * Consecutive, one-based transport revision. A patch sent by the notebook
   * view instead carries the last kernel revision the view had applied.
   */
  revision: number
  /** Canonical Bokeh document patch applied to the mounted document. */
  content: Patch
  /** IDs corresponding positionally to the separately transported buffers. */
  buffer_ids?: ID[]
}

/**
 * A notebook patch could not be applied without violating transport ordering.
 *
 * `invalid` identifies a malformed envelope, `gap` asks the host to recover
 * from a missing revision with a fresh embed snapshot, and `buffers`
 * identifies metadata that does not describe the supplied binary payload.
 */
export class NotebookPatchError extends Error {
  override readonly name = "BokehNotebookPatchError"

  constructor(readonly code: "invalid" | "gap" | "buffers", message: string) {
    super(message)
  }
}

function array_buffer(view: DataView): ArrayBuffer {
  const {buffer, byteOffset, byteLength} = view
  if (buffer instanceof ArrayBuffer && byteOffset == 0 && byteLength == buffer.byteLength) {
    return buffer
  }
  return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer
}

function patch_receiver(document: Document, initial_revision: number) {
  let revision = initial_revision
  const receive = (message: unknown, buffers: DataView[] = []): void => {
    if (typeof message != "object" || message == null) {
      throw new NotebookPatchError("invalid", "the notebook transport received an invalid patch envelope")
    }
    const envelope = message as Partial<NotebookPatch>
    const next_revision = envelope.revision
    if (envelope.kind != "patch" || typeof next_revision != "number" || !Number.isSafeInteger(next_revision) ||
        next_revision < 1 || envelope.content == null) {
      throw new NotebookPatchError("invalid", "the notebook transport received an invalid patch envelope")
    }
    if (next_revision <= revision) {
      return // A reconnected transport may replay an already applied patch.
    }
    if (next_revision != revision + 1) {
      throw new NotebookPatchError(
        "gap", `notebook patch revision ${next_revision} does not follow ${revision}`,
      )
    }
    const ids = envelope.buffer_ids ?? []
    if (ids.length != buffers.length || new Set(ids).size != ids.length) {
      throw new NotebookPatchError("buffers", "notebook patch buffer metadata does not match its binary payload")
    }
    const mapped = new Map<ID, ArrayBuffer>()
    for (let index = 0; index < ids.length; index++) {
      mapped.set(ids[index], array_buffer(buffers[index]))
    }
    document.apply_json_patch(envelope.content, mapped)
    revision = next_revision
  }
  return {receive, revision: () => revision}
}

/**
 * Create the incremental patch endpoint for one mounted notebook document.
 *
 * The receiver accepts only the revision immediately following the last
 * successfully applied patch. Replayed revisions are harmless no-ops, while a
 * gap or invalid binary metadata throws [[NotebookPatchError]] so the notebook
 * host can request a fresh embed snapshot. A failed `apply_json_patch()`
 * does not advance the revision: retry or snapshot recovery still begins from
 * the last document state known to have succeeded.
 *
 * @param document the document owned by the output's current `BokehMount`
 * @param initial_revision the revision represented by its initial embed payload
 * @returns a receiver scoped to that document and revision sequence
 */
export function create_notebook_patch_receiver(document: Document, initial_revision = 0):
(message: unknown, buffers?: DataView[]) => void {
  return patch_receiver(document, initial_revision).receive
}

export type NotebookPatchSender = (patch: NotebookPatch, buffers: ArrayBuffer[]) => void

export type NotebookSession = {
  /** Apply a kernel patch, as the receiver of [[create_notebook_patch_receiver]] does. */
  receive(message: unknown, buffers?: DataView[]): void
  /** Stop sending local changes and discard changes deferred by callback policies. */
  close(): void
}

/**
 * Create a two-way endpoint for one mounted notebook document.
 *
 * Kernel patches are received as by [[create_notebook_patch_receiver]]. Local
 * changes are batched and deferred by the same callback policies as a server
 * [[ClientSession]] and passed to `send` as patch envelopes, whose `revision`
 * is the last kernel revision applied to `document`. Changes applied from
 * kernel patches are not sent back.
 *
 * @param document the document owned by the output's current `BokehMount`
 * @param initial_revision the revision represented by its initial embed payload
 * @param send delivers a local patch and its binary buffers to the kernel
 */
export function create_notebook_session(document: Document, initial_revision: number,
    send: NotebookPatchSender): NotebookSession {
  const {receive, revision} = patch_receiver(document, initial_revision)
  const connection: SessionConnection = {
    id: unique_id(),
    send(message) {
      const buffers: ArrayBuffer[] = []
      const buffer_ids: ID[] = []
      const content = JSON.parse(JSON.stringify(message.content, (_, value) => {
        if (value instanceof Buffer) {
          const id = `${buffers.length}`
          buffer_ids.push(id)
          buffers.push(value.buffer)
          return {id}
        }
        return value
      })) as Patch
      send({kind: "patch", revision: revision(), content, buffer_ids}, buffers)
      return true
    },
    async send_with_reply() {
      throw new Error("notebook sessions don't support request replies")
    },
    close() {
      session._connection_closed()
    },
  }
  const session = new ClientSession(connection, document)
  return {
    receive,
    close: () => connection.close(),
  }
}
