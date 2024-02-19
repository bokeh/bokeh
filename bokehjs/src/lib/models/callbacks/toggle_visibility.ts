import {Callback} from "./callback"
import {UIElement} from "../ui/ui_element"
import type * as p from "core/properties"

export namespace ToggleVisibility {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Callback.Props & {
    target: p.Property<UIElement>
  }
}

export interface ToggleVisibility extends ToggleVisibility.Attrs {}

export class ToggleVisibility extends Callback {
  declare properties: ToggleVisibility.Props

  constructor(attrs?: Partial<ToggleVisibility.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleVisibility.Props>(({Ref}) => ({
      target: [ Ref(UIElement) ],
    }))
  }

  execute(): void {
    const {target} = this
    target.visible = !target.visible
  }
}
