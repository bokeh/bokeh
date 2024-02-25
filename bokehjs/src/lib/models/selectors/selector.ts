import {Model} from "../../model"
import type * as p from "core/properties"

export namespace Selector {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    query: p.Property<string>
  }
}

export interface Selector extends Selector.Attrs {}

export abstract class Selector extends Model {
  declare properties: Selector.Props

  constructor(attrs?: Partial<Selector.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Selector.Props>(({Str}) => ({
      query: [ Str ],
    }))
  }

  abstract find_one(target: ParentNode): Node | null
}
