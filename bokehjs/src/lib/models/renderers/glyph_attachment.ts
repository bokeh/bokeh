import {Model} from "../../model"
import {DOMComponentView} from "core/dom_view"
import type {Context2d} from "core/util/canvas"
import type {Indices} from "core/types"
import type {GlyphView} from "../glyphs/glyph"
import type {GlyphRendererView} from "./glyph_renderer"

/** An attachment prepared against the mapped glyph and indices for one paint pass. */
export type PreparedAttachment = {
  clip?(ctx: Context2d): void
  paint_before?(ctx: Context2d): void
  paint?(ctx: Context2d): void
}

export abstract class GlyphAttachmentView extends DOMComponentView {
  declare model: GlyphAttachment
  declare readonly parent: GlyphRendererView

  get canvas() {
    return this.parent.canvas
  }

  request_paint(): void {
    if (!this.is_destroyed) {
      this.parent.request_paint()
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
  }

  /** Choose subset rows from the filtered view without modifying the glyph's viewport mask. */
  paint_candidates(_glyph: GlyphView, masked: Indices): Indices {
    return masked
  }

  /** Indices are in the space expected by the active glyph's paint method. */
  abstract prepare(glyph: GlyphView, indices: Int32Array): PreparedAttachment | null
}

/** Base model for attachments owned and painted by a glyph renderer. */
export abstract class GlyphAttachment extends Model {
  declare __view_type__: GlyphAttachmentView
}
