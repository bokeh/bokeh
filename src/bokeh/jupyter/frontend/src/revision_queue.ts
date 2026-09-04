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

  get awaitingResync(): boolean {
    return this.awaitingSnapshot
  }

  pushPatch(message: any, buffers: DataView[]): QueueResult {
    if (this.awaitingSnapshot) return "ignored"
    const bytes = buffers.reduce((total, view) => total + view.byteLength, new TextEncoder().encode(JSON.stringify(message)).byteLength)
    this.patches.push({message, buffers, bytes})
    this.bytes += bytes
    if (this.patches.length <= MAX_PENDING_PATCHES && this.bytes <= MAX_PENDING_BYTES) {
      this.startPump()
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
