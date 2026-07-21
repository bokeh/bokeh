import type {GlyphView} from "@bokehjs/models/glyphs/glyph"
import type {BaseGLGlyph} from "@bokehjs/models/glyphs/webgl/base"
import type {PlotView} from "@bokehjs/models/plots/plot_canvas"
import {actions, xy} from "./interactive"
import type {Point} from "./interactive"

/** Wait for rendering and browser compositing without depending on a particular
 * WebGL backend implementation. */
export async function settle_webgl(view: PlotView, frames: number = 2): Promise<void> {
  for (let i = 0; i < frames; i++) {
    await view.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

export function require_glglyph(glyph: GlyphView): BaseGLGlyph {
  if (!glyph.has_webgl()) {
    throw new Error(`${glyph} did not initialize a WebGL glyph`)
  }
  return glyph.glglyph
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
