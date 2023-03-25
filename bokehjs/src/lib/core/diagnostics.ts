export type Listener = (obj: unknown) => void

export class Diagnostics {
  protected readonly listeners: Set<Listener> = new Set()

  connect(listener: Listener) {
    this.listeners.add(listener)
  }

  disconnect(listener: Listener) {
    this.listeners.delete(listener)
  }

  report(obj: unknown): void {
    for (const listener of this.listeners) {
      listener(obj)
    }
  }
}

export const diagnostics = new Diagnostics()
