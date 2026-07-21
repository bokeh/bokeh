import type {PlotView} from "@bokehjs/models/plots/plot_canvas"
import type {GlyphView} from "@bokehjs/models/glyphs/glyph"
import type {BaseGLGlyph} from "@bokehjs/models/glyphs/webgl/base"
import {WrappedBuffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {actions, xy} from "./interactive"
import type {Point} from "./interactive"

export type WebGLBufferTotals = {
  buffers: number
  full_uploads: number
  partial_uploads: number
  bytes: number
}

export async function settle_webgl(view: PlotView, frames: number = 2): Promise<void> {
  for (let i = 0; i < frames; i++) {
    await view.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  view.canvas_view.flush_webgl()
}

export function require_glglyph(glyph: GlyphView): BaseGLGlyph {
  if (!glyph.has_webgl()) {
    throw new Error(`${glyph} did not initialize a WebGL glyph`)
  }
  return glyph.glglyph
}

export function wrapped_buffers(root: object): WrappedBuffer<Float32Array | Uint8Array>[] {
  const buffers: WrappedBuffer<Float32Array | Uint8Array>[] = []
  const seen = new Set<object>()
  const visit = (value: unknown) => {
    if (value == null || typeof value != "object" || seen.has(value)) {
      return
    }
    seen.add(value)
    if (value instanceof WrappedBuffer) {
      buffers.push(value as WrappedBuffer<Float32Array | Uint8Array>)
    } else if (Array.isArray(value)) {
      for (const item of value) {
        visit(item)
      }
    } else if (value instanceof Map || value instanceof Set) {
      for (const item of value.values()) {
        visit(item)
      }
    } else if (!ArrayBuffer.isView(value) && !(value instanceof ArrayBuffer)) {
      for (const [name, item] of Object.entries(value)) {
        if (name != "glyph" && name != "regl_wrapper" && name != "_regl") {
          visit(item)
        }
      }
    }
  }
  visit(root)
  return buffers
}

export function buffer_upload_totals(root: object): WebGLBufferTotals {
  const buffers = wrapped_buffers(root)
  return buffers.reduce<WebGLBufferTotals>((total, buffer) => {
    const {full_uploads, partial_uploads, bytes} = buffer.upload_stats
    total.full_uploads += full_uploads
    total.partial_uploads += partial_uploads
    total.bytes += bytes
    return total
  }, {buffers: buffers.length, full_uploads: 0, partial_uploads: 0, bytes: 0})
}

export function reset_buffer_upload_stats(root: object): void {
  for (const buffer of wrapped_buffers(root)) {
    buffer.reset_upload_stats()
  }
}

export class WebGLScenario {
  private readonly _actions

  constructor(readonly view: PlotView) {
    this._actions = actions(view, {pause: 0})
  }

  async settle(): Promise<void> {
    await settle_webgl(this.view)
  }

  async pan(from: Point = xy(5, 5), to: Point = xy(6, 4)): Promise<void> {
    await this._actions.pan(from, to, 4)
    await this.settle()
  }

  async zoom(at: Point = xy(5, 5), steps: number = 2): Promise<void> {
    if (steps > 0) {
      await this._actions.scroll_up(at, steps)
    } else if (steps < 0) {
      await this._actions.scroll_down(at, -steps)
    }
    await this.settle()
  }

  async hover(at: Point): Promise<void> {
    await this._actions.hover(at)
    await this.settle()
  }

  async reset(): Promise<void> {
    this.view.reset()
    await this.settle()
  }

  async mutate(action: () => void | Promise<void>): Promise<void> {
    await action()
    await this.settle()
  }
}
