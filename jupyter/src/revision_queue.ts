import {MAX_PENDING_BYTES, MAX_PENDING_PATCHES} from "./protocol"
export {MAX_PENDING_BYTES, MAX_PENDING_PATCHES} from "./protocol"

export type RevisionItem = {message: any, buffers: DataView[]}
export type QueueResult = "queued" | "ignored" | "overflow"
export type RevisionConsumer = (message: any, buffers: DataView[]) => void | Promise<void>

type PendingPatch = RevisionItem & {bytes: number}

/** A bounded queue and serial consumer pump for revisioned notebook transports. */
export class RevisionQueue {
  private snapshot?: RevisionItem
  private patches: PendingPatch[] = []
  private bytes = 0
  private awaitingSnapshot = false
  private consumer?: RevisionConsumer
  private pumping = false
  private latestRevision?: number

  get awaitingResync(): boolean {
    return this.awaitingSnapshot
  }

  pushPatch(message: any, buffers: DataView[]): QueueResult {
    if (this.awaitingSnapshot) return "ignored"
    const revision = message.revision as number
    if (this.latestRevision != null) {
      if (revision <= this.latestRevision) return "ignored"
      if (revision !== this.latestRevision + 1) {
        this.patches = []
        this.bytes = 0
        this.awaitingSnapshot = true
        return "overflow"
      }
    }
    const bytes = buffers.reduce((total, view) => total + view.byteLength, new TextEncoder().encode(JSON.stringify(message)).byteLength)
    this.patches.push({message, buffers, bytes})
    this.bytes += bytes
    this.latestRevision = revision
    this.startPump()
    if (this.patches.length <= MAX_PENDING_PATCHES && this.bytes <= MAX_PENDING_BYTES) {
      return "queued"
    }
    this.patches = []
    this.bytes = 0
    this.awaitingSnapshot = true
    return "overflow"
  }

  reset(revision: number): void {
    this.awaitingSnapshot = false
    this.patches = this.patches.filter((patch) => patch.message.revision > revision)
    this.bytes = this.patches.reduce((total, patch) => total + patch.bytes, 0)
    this.latestRevision = this.patches.reduce(
      (latest, patch) => Math.max(latest, patch.message.revision),
      revision,
    )
  }

  replaceWithSnapshot(message: any, buffers: DataView[] = []): void {
    this.reset(message.revision)
    this.snapshot = {message, buffers}
    this.startPump()
  }

  subscribe(callback: RevisionConsumer): void {
    this.consumer = callback
    this.startPump()
  }

  unsubscribe(callback: RevisionConsumer): void {
    if (this.consumer === callback) this.consumer = undefined
  }

  requestResync(): boolean {
    if (this.awaitingSnapshot) return false
    this.snapshot = undefined
    this.patches = []
    this.bytes = 0
    this.awaitingSnapshot = true
    return true
  }

  clear(): void {
    this.snapshot = undefined
    this.patches = []
    this.bytes = 0
    this.awaitingSnapshot = false
    this.consumer = undefined
    this.latestRevision = undefined
  }

  private startPump(): void {
    if (this.pumping || this.consumer == null) return
    this.pumping = true
    void this.pump()
  }

  private async pump(): Promise<void> {
    try {
      while (this.consumer != null) {
        let item = this.snapshot
        if (item != null) {
          this.snapshot = undefined
        } else {
          const patch = this.patches.shift()
          if (patch == null) break
          this.bytes -= patch.bytes
          item = patch
        }
        await this.consumer(item.message, item.buffers)
      }
    } finally {
      this.pumping = false
      if (this.consumer != null && (this.snapshot != null || this.patches.length != 0)) this.startPump()
    }
  }
}
