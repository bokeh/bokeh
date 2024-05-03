import {Model} from "../../model"
import type * as p from "core/properties"

export namespace RendererGroup {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    visible: p.Property<boolean>
  }
}

export interface RendererGroup extends RendererGroup.Attrs {}

export class RendererGroup extends Model {
  declare properties: RendererGroup.Props

  constructor(attrs?: Partial<RendererGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RendererGroup.Props>(({Bool}) => ({
      visible: [ Bool, true ],
    }))
  }
}
