// This module implements the Base GL Glyph and some utilities
import type {Context2d} from "core/util/canvas"
import type {GlyphView} from "../glyph"
import type {ReglWrapper} from "./regl_wrap"
import type {GPUResource} from "./resource_owner"
import {GPUResourceOwner} from "./resource_owner"
import type {RevisionDomain} from "./revisions"
import type {RevisionSnapshot} from "./revisions"
import {RevisionState} from "./revisions"
import type {DataMapping} from "./data_mapping"

export type BaseGLGlyphConstructor = {
  new(regl: ReglWrapper, base_glyph: GlyphView): BaseGLGlyph
}

export abstract class BaseGLGlyph {
  protected nvertices: number = 0
  private readonly _resources = new GPUResourceOwner()
  protected readonly revisions = new RevisionState()

  protected get data_changed(): boolean {
    return this.revisions.changed("geometry", "legacy-data")
  }
  protected set data_changed(changed: boolean) {
    if (changed) {
      this.revisions.bump("geometry")
    } else {
      this.revisions.consume("geometry", "legacy-data")
    }
  }

  protected get data_mapped(): boolean {
    return this.revisions.changed("mapping", "legacy-mapping")
  }
  protected set data_mapped(changed: boolean) {
    if (changed) {
      this.revisions.bump("mapping")
    } else {
      this.revisions.consume("mapping", "legacy-mapping")
    }
  }

  protected get visuals_changed(): boolean {
    return this.revisions.changed("visuals", "legacy-visuals")
  }
  protected set visuals_changed(changed: boolean) {
    if (changed) {
      this.revisions.bump("visuals")
    } else {
      this.revisions.consume("visuals", "legacy-visuals")
    }
  }

  constructor(protected readonly regl_wrapper: ReglWrapper, readonly glyph: GlyphView) {}

  get diagnostics(): {revisions: RevisionSnapshot, resources: number, destroyed: boolean} {
    return {
      revisions: this.revisions.snapshot,
      resources: this._resources.size,
      destroyed: this._resources.destroyed,
    }
  }

  /** Optional vertex-shader mapping for immutable data-coordinate buffers. */
  get data_mapping(): DataMapping | null {
    return null
  }

  set_data_changed(): void {
    const {data_size} = this.glyph
    if (data_size != this.nvertices) {
      this.nvertices = data_size
    }
    this.revisions.bump("geometry")
  }

  set_data_mapped(): void {
    this.revisions.bump("mapping")
  }

  set_visuals_changed(): void {
    this.revisions.bump("visuals")
  }

  /** Re-upload all retained state after the browser restores the GL context. */
  context_restored(): void {
    this.revisions.bump("geometry")
    this.revisions.bump("mapping")
    this.revisions.bump("visuals")
    this.revisions.bump("selection")
  }

  render(_ctx: Context2d, indices: number[], mainglyph: GlyphView): void {
    const selection_changed = this.revisions.sync_selection(indices)
    if (indices.length == 0 && !selection_changed &&
        !this.data_changed && !this.data_mapped && !this.visuals_changed) {
      return
    }
    const canvas_view = this.glyph.renderer.plot_view.canvas_view
    const queued_indices = [...indices]
    canvas_view.enqueue_webgl({
      label: this.glyph.toString(),
      execute: () => {
        const {width, height} = canvas_view.webgl!.canvas
        const {pixel_ratio} = canvas_view
        const trans = {
          pixel_ratio,
          width:  width / pixel_ratio,
          height: height / pixel_ratio,
        }
        this.draw(queued_indices, mainglyph, trans)
        canvas_view.mark_webgl_dirty()
      },
    })
  }

  abstract draw(indices: number[], mainglyph: GlyphView, trans: Transform): void

  protected own<T extends GPUResource>(resource: T): T {
    return this._resources.own(resource)
  }

  protected release<T extends GPUResource>(resource: T | null | undefined): null {
    return this._resources.release(resource)
  }

  protected replace<T extends GPUResource>(previous: T | null | undefined, replacement: T): T {
    return this._resources.replace(previous, replacement)
  }

  protected revision_changed(domain: RevisionDomain, consumer: string): boolean {
    return this.revisions.changed(domain, consumer)
  }

  protected consume_revision(domain: RevisionDomain, consumer: string): number {
    return this.revisions.consume(domain, consumer)
  }

  destroy(): void {
    this.regl_wrapper.flush()
    this._resources.destroy()
  }
}

export type Transform = {
  pixel_ratio: number
  width: number
  height: number
}
