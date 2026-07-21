export type GPUResource = {
  destroy(): void
}

/** Owns GPU resources with deterministic, idempotent destruction.
 *
 * Ownership is explicit: shared resources stay with ReglWrapper, while each
 * glyph owns only the buffers/textures/elements it creates. */
export class GPUResourceOwner implements GPUResource {
  private readonly _resources = new Set<GPUResource>()
  private _destroyed = false

  own<T extends GPUResource>(resource: T): T {
    if (this._destroyed) {
      resource.destroy()
      throw new Error("cannot add a resource to a destroyed owner")
    }
    this._resources.add(resource)
    return resource
  }

  release<T extends GPUResource>(resource: T | null | undefined, destroy: boolean = true): null {
    if (resource != null && this._resources.delete(resource) && destroy) {
      resource.destroy()
    }
    return null
  }

  replace<T extends GPUResource>(previous: T | null | undefined, replacement: T): T {
    this.release(previous)
    return this.own(replacement)
  }

  get size(): number {
    return this._resources.size
  }

  get destroyed(): boolean {
    return this._destroyed
  }

  destroy(): void {
    if (this._destroyed) {
      return
    }
    this._destroyed = true
    for (const resource of this._resources) {
      resource.destroy()
    }
    this._resources.clear()
  }
}
