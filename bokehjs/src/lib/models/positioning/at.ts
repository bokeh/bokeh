import {Position} from "./position"
import {Size} from "./size"
import {Coordinate} from "../coordinates/coordinate"
import {Anchor} from "core/enums"
import * as p from "core/properties"

export namespace At {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Position.Props & {
    loc: p.Property<Coordinate>
    size: p.Property<Size>
    anchor: p.Property<Anchor>
  }
}

export interface At extends At.Attrs {}

export class At extends Position {
  override properties: At.Props

  constructor(attrs?: Partial<At.Attrs>) {
    super(attrs)
  }

  static {
    this.define<At.Props>(({Ref}) => ({
      loc: [ Ref(Coordinate) ],
      size: [ Ref(Size) ],
      anchor: [ Anchor, "top_left" ],
    }))
  }
}
