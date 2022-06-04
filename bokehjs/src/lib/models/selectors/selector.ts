import {Model} from "../../model"
import * as p from "core/properties"

export namespace Selector {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    query: p.Property<string>
  }
}

export interface Selector extends Selector.Attrs {}

export abstract class Selector extends Model {
  override properties: Selector.Props

  constructor(attrs?: Partial<Selector.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Selector.Props>(({String}) => ({
      query: [ String ],
    }))
  }

  abstract find_one(target: ParentNode): Node | null
}
