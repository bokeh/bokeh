import {Segment, SegmentView} from "./segment"
import {ArrowHead, OpenHead} from "../annotations/arrow_head"
import {Decoration} from "../graphics/decoration"
import type * as p from "core/properties"

export interface ArrowGlyphView extends ArrowGlyph.Data {}

export class ArrowGlyphView extends SegmentView {
  declare model: ArrowGlyph
  declare visuals: ArrowGlyph.Visuals

  override get computed_decorations(): Decoration[] {
    const decorations = [...super.computed_decorations]
    const {start, end} = this.model
    if (start != null) {
      decorations.push(new Decoration({marking: start, node: "start"}))
    }
    if (end != null) {
      decorations.push(new Decoration({marking: end, node: "end"}))
    }
    return decorations
  }
}

export namespace ArrowGlyph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Segment.Props & {
    start: p.Property<ArrowHead | null>
    end: p.Property<ArrowHead | null>
  } & Mixins

  export type Mixins = Segment.Mixins

  export type Visuals = Segment.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface ArrowGlyph extends ArrowGlyph.Attrs {}

export class ArrowGlyph extends Segment {
  declare properties: ArrowGlyph.Props
  declare __view_type__: ArrowGlyphView

  constructor(attrs?: Partial<ArrowGlyph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ArrowGlyphView

    this.define<ArrowGlyph.Props>(({Nullable, Ref}) => ({
      start: [ Nullable(Ref(ArrowHead)), null ],
      end:   [ Nullable(Ref(ArrowHead)), () => new OpenHead() ],
    }))
  }
}
