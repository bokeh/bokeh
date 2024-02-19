import {Coordinate} from "./coordinate"
import type * as p from "core/properties"
import type {GlyphRenderer} from "../renderers/glyph_renderer"

export namespace Indexed {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Coordinate.Props & {
    index: p.Property<number>
    renderer: p.Property<GlyphRenderer>
  }
}

export interface Indexed extends Indexed.Attrs {}

export class Indexed extends Coordinate {
  declare properties: Indexed.Props

  constructor(attrs?: Partial<Indexed.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Indexed.Props>(({Int, AnyRef}) => ({
      index: [ Int ],
      renderer: [ AnyRef<GlyphRenderer>() ],
    }))
  }
}
