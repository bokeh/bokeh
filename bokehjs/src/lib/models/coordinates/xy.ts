import {Coordinate} from "./coordinate"
import type * as p from "core/properties"

export namespace XY {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Coordinate.Props & {
    x: p.Property<number>
    y: p.Property<number>
  }
}

export interface XY extends XY.Attrs {}

export class XY extends Coordinate {
  declare properties: XY.Props

  constructor(attrs?: Partial<XY.Attrs>) {
    super(attrs)
  }

  static {
    this.define<XY.Props>(({Float}) => ({
      x: [ Float ],
      y: [ Float ],
    }))
  }
}
